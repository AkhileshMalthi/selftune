import os
from tempfile import TemporaryDirectory
from pathlib import Path
import json
import logging
import boto3
from botocore.config import Config

from sqlmodel import Session, create_engine, select
import torch
from datasets import Dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer
import wandb

from worker import app

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config
DB_URL = os.getenv("DATABASE_URL", "postgresql://selftune:selftune@postgres:5432/selftune")
engine = create_engine(DB_URL)

S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://minio:9000")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
S3_BUCKET_DATASETS = os.getenv("S3_BUCKET_DATASETS", "datasets")
S3_BUCKET_MODELS = os.getenv("S3_BUCKET_MODELS", "models")


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT,
        aws_access_key_id=S3_ACCESS_KEY,
        aws_secret_access_key=S3_SECRET_KEY,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def download_dataset_from_s3(s3_key: str, local_path: str):
    s3 = get_s3_client()
    s3.download_file(S3_BUCKET_DATASETS, s3_key, local_path)


def upload_model_to_s3(local_dir: str, prefix: str) -> str:
    s3 = get_s3_client()
    for root, _, files in os.walk(local_dir):
        for file in files:
            local_path = os.path.join(root, file)
            # Make relative path for S3 key
            rel_path = os.path.relpath(local_path, local_dir)
            s3_key = f"{prefix}/{rel_path}"
            
            logger.info(f"Uploading {local_path} to {S3_BUCKET_MODELS}/{s3_key}")
            s3.upload_file(local_path, S3_BUCKET_MODELS, s3_key)
    
    return prefix # Return base directory prefix


def build_hf_dataset(jsonl_path: str) -> Dataset:
    # Read strict OpenAI chat jsonl format into HF dataset
    # e.g., {"messages": [{"role": "user", "content": "..."}, ...]}
    texts = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip():
                continue
            data = json.loads(line)
            # simplistic concatenation for base ML capability testing
            # Standard formatting usually done with tokenizer.apply_chat_template
            chat_str = ""
            for msg in data.get("messages", []):
                role = msg.get("role")
                content = msg.get("content")
                if role == "system":
                    chat_str += f"<|system|>\n{content}\n"
                elif role == "user":
                    chat_str += f"<|user|>\n{content}\n"
                elif role == "assistant":
                    chat_str += f"<|assistant|>\n{content}\n"
            texts.append({"text": chat_str})
    
    return Dataset.from_list(texts)


@app.task(name="train_model_task", bind=True)
def train_model_task(self, job_id: int):
    # To avoid circular imports, load models dynamically or define them simply here
    # Because SQLModel is declarative, we can just redeclare the essentials or rely on the backend module if shared.
    # To emulate, we'll redefine the minimal ORM classes here to avoid importing complex backend logic.
    from sqlmodel import SQLModel, Field
    from datetime import datetime, timezone

    class FineTuningJob(SQLModel, table=True):
        __tablename__ = "fine_tuning_jobs"
        id: int | None = Field(default=None, primary_key=True)
        user_id: int = Field(index=True)
        dataset_id: int = Field(index=True)
        base_model: str
        learning_rate: float
        num_epochs: int
        status: str
        error_message: str | None

    class DatasetRecord(SQLModel, table=True):
        __tablename__ = "datasets"
        id: int | None = Field(default=None, primary_key=True)
        s3_key: str

    class TunedModel(SQLModel, table=True):
        __tablename__ = "tuned_models"
        id: int | None = Field(default=None, primary_key=True)
        user_id: int = Field(index=True)
        job_id: int = Field(index=True, unique=True)
        name: str
        base_model: str
        s3_key: str
        created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    with Session(engine) as session:
        job = session.exec(select(FineTuningJob).where(FineTuningJob.id == job_id)).first()
        if not job:
            logger.error(f"Job {job_id} not found.")
            return

        dataset_rec = session.exec(select(DatasetRecord).where(DatasetRecord.id == job.dataset_id)).first()
        if not dataset_rec:
            logger.error(f"Dataset {job.dataset_id} not found for job {job_id}.")
            job.status = "failed"
            job.error_message = "Dataset record missing."
            session.add(job)
            session.commit()
            return

        job.status = "running"
        session.add(job)
        session.commit()

        try:
            with TemporaryDirectory() as temp_dir:
                local_data_path = os.path.join(temp_dir, "dataset.jsonl")
                logger.info(f"Downloading dataset {dataset_rec.s3_key} from MinIO...")
                download_dataset_from_s3(dataset_rec.s3_key, local_data_path)

                hf_dataset = build_hf_dataset(local_data_path)
                logger.info(f"Dataset loaded with {len(hf_dataset)} examples.")

                output_dir = os.path.join(temp_dir, "output")
                
                # Load Model and Tokenizer
                logger.info(f"Loading Base Model: {job.base_model}")
                tokenizer = AutoTokenizer.from_pretrained(job.base_model, trust_remote_code=True)
                if getattr(tokenizer, "pad_token", None) is None:
                    tokenizer.pad_token = tokenizer.eos_token
                
                # Device map logic
                device_map = "auto" if torch.cuda.is_available() else "cpu"
                
                model = AutoModelForCausalLM.from_pretrained(
                    job.base_model,
                    device_map=device_map,
                    trust_remote_code=True,
                )

                # Configure LoRA
                peft_config = LoraConfig(
                    r=8,
                    lora_alpha=16,
                    lora_dropout=0.05,
                    bias="none",
                    task_type="CAUSAL_LM",
                )
                
                model = get_peft_model(model, peft_config)

                # Training arguments
                training_args = TrainingArguments(
                    output_dir=output_dir,
                    per_device_train_batch_size=2,
                    gradient_accumulation_steps=2,
                    learning_rate=job.learning_rate,
                    num_train_epochs=job.num_epochs,
                    logging_steps=10,
                    save_strategy="no",
                    report_to="wandb",
                    run_name=f"job-{job.id}-{job.base_model.split('/')[-1]}",
                )
                
                # Initialize W&B run
                wandb.init(
                    project=os.getenv("WANDB_PROJECT", "selftune"),
                    name=training_args.run_name,
                    config={
                        "job_id": job.id,
                        "user_id": job.user_id,
                        "dataset_id": dataset_rec.id,
                        "base_model": job.base_model,
                        "learning_rate": job.learning_rate,
                        "epochs": job.num_epochs,
                    }
                )

                # SFTTrainer
                logger.info("Starting training via SFTTrainer...")
                trainer = SFTTrainer(
                    model=model,
                    train_dataset=hf_dataset,
                    peft_config=peft_config,
                    dataset_text_field="text",
                    max_seq_length=512,
                    tokenizer=tokenizer,
                    args=training_args,
                )
                
                trainer.train()

                # Save model to disk
                logger.info(f"Saving adapters to {output_dir}")
                trainer.model.save_pretrained(output_dir)
                tokenizer.save_pretrained(output_dir)

                # Upload to S3
                s3_prefix = f"adapters/{job.user_id}/{job.id}"
                logger.info("Uploading model to S3...")
                upload_model_to_s3(output_dir, s3_prefix)

                # Successful completion!
                job.status = "completed"
                
                model_record = TunedModel(
                    user_id=job.user_id,
                    job_id=job.id,
                    name=f"Fine-tuned {job.base_model}",
                    base_model=job.base_model,
                    s3_key=s3_prefix
                )
                session.add(model_record)

        except Exception as e:
            logger.exception("Training failed.")
            job.status = "failed"
            job.error_message = str(e)
        finally:
            wandb.finish()
            session.add(job)
            session.commit()
