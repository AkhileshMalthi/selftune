# Selftune: MLOps Fine-Tuning Platform

Selftune is a comprehensive, self-service platform designed to abstract the complexity of fine-tuning Large Language Models (LLMs). It provides an end-to-end MLOps pipeline covering data ingestion, automated data validation, asynchronous GPU-accelerated training, and model artifact management.

## Features

- **User Authentication:** Secure registration and login.
- **Data Upload & Validation:** 
  - Direct-to-S3 multipart uploading for massive JSONL datasets.
  - Automated 4-stage validation pipeline: OpenAI chat format verification, `tiktoken` token counting, exact replica deduplication, and Toxicity scanning.
- **Asynchronous LoRA Fine-Tuning:**
  - Dedicated, isolated GPU worker utilizing Hugging Face `peft`, `trl`, and `transformers`.
  - Non-blocking execution orchestrated via Celery and RabbitMQ.
- **Experiment Tracking:** Live metric logging streamed to Weights & Biases (W&B).
- **Artifact Management:** Fine-tuned LoRA adapters are versioned and stored securely in an S3-compatible object store (MinIO).

## Architecture Overview

Selftune follows a decoupled, service-oriented architecture:
- **Frontend:** React + Vite + TailwindCSS.
- **Backend API:** FastAPI + SQLModel mapping to PostgreSQL.
- **Storage:** PostgreSQL for metadata, MinIO (S3) for datasets and model artifacts.
- **Message Broker:** RabbitMQ.
- **Workers:** 
  - Standard celery worker for data validation.
  - Dedicated GPU `ml_worker` for running resource-intensive `SFTTrainer` loops.

For deeper insights, please consult the [ARCHITECTURE.md](./ARCHITECTURE.md) blueprint.

## Local Development Setup (Docker Compose)

The entire infrastructure has been containerized and is designed to run locally using Docker Compose.

### Prerequisites
- Docker and Docker Compose installed.
- (Optional but heavily recommended): NVIDIA GPU with the NVIDIA Container Toolkit activated for the `ml_worker` to utilize `cuda`.

### 1. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```
Ensure you provide your valid credentials inside `.env`:
- `WANDB_API_KEY`: Your weights and biases API key for experiment tracking.
- `MODERATION_API_KEY`: A moderation API key (e.g., ModerateAPI) for the toxicity stage.
- `HF_TOKEN`: (Optional) specifically if you're pulling gated Hugging Face base models.

### 2. Bootstrapping the Platform

Run the following command at the root to build and start all 6 services:
```bash
docker-compose up -d --build
```
This will spin up:
- The React Frontend (Port 8080)
- The FastAPI Backend (Port 8000)
- PostgreSQL Database
- RabbitMQ Message Broker
- MinIO S3 Server (Ports 9000 API / 9001 Console)
- The Celery Validation Worker
- The Celery ML GPU Worker

### 3. Usage Guide

1. **Access the App:** Open your browser and navigate to `http://localhost:8080`.
2. **Register:** Create a new account.
3. **Upload Dataset:** Navigate to the "Datasets" tab and upload a valid JSONL conversational dataset.
4. **Validation:** Wait for the platform to process your dataset. You can view the specific validation report showing rows parsed, token sizes, duplicate removal, and toxicity scores. Once it passes, the status changes to `Ready`.
5. **Config Job:** Go to the "Fine-Tune" view. Select your verified dataset, pick a base model (e.g. `HuggingFaceTB/SmolLM-135M` for local testing without vast VRAM), configure learning rate and epochs, and Launch.
6. **Track Progress:** Navigate to "Jobs" to observe the async pipeline. You can check your W&B dashboard live!
7. **View Models:** Once complete, check the "Models" view for your configured adapter.

## API Examples

### List Jobs (GET `/api/v1/jobs`)
```bash
curl -X 'GET' \
  'http://localhost:8000/api/v1/jobs/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <YOUR_TOKEN>'
```

### Launch Job (POST `/api/v1/jobs`)
```bash
curl -X 'POST' \
  'http://localhost:8000/api/v1/jobs/' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <YOUR_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
  "dataset_id": 1,
  "base_model": "HuggingFaceTB/SmolLM-135M",
  "learning_rate": 0.0002,
  "num_epochs": 3
}'
```
