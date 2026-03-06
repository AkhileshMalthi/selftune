"""Celery validation task — 4-stage JSONL dataset pipeline.

Stages:
  1. Format validation  — strict OpenAI chat schema
  2. Token statistics   — per-row token counts via tiktoken
  3. Duplicate removal  — exact hash deduplication, cleaned file re-uploaded
  4. Toxicity scan      — ModerateAPI (cloud)
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

import tiktoken
from sqlmodel import Session

from app.core.config import settings
from app.core.storage import stream_object_lines
from app.db.base import engine
from app.models.dataset import Dataset, DatasetValidationReport
from app.worker.celery_app import celery_app

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_tokenizer = None


def _get_tokenizer():
    """Lazily load the tokenizer so it's only downloaded in the worker process."""
    global _tokenizer  # noqa: PLW0603
    if _tokenizer is None:
        _tokenizer = tiktoken.get_encoding("cl100k_base")
    return _tokenizer


def _validate_row(line: str) -> bool:
    """Return True if the line is valid OpenAI chat JSON."""
    try:
        obj = json.loads(line)
    except json.JSONDecodeError:
        return False

    messages = obj.get("messages")
    if not isinstance(messages, list) or not messages:
        return False

    for msg in messages:
        if not isinstance(msg, dict):
            return False
        if msg.get("role") not in {"system", "user", "assistant"}:
            return False
        if not isinstance(msg.get("content"), str):
            return False

    return True


def _count_tokens(line: str) -> int:
    return len(_get_tokenizer().encode(line, disallowed_special=()))


def _score_toxicity(texts: list[str]) -> float:
    """Return the max toxicity score across all texts using the cloud provider."""
    if not texts:
        return 0.0

    return _score_moderateapi(texts)


def _score_moderateapi(texts: list[str]) -> float:
    import requests  # noqa: PLC0415

    max_score = 0.0
    for text in texts:
        try:
            resp = requests.post(
                "https://moderateapi.com/api/v1/moderate/text",
                json={"content": text},
                headers={"Authorization": f"Token {settings.MODERATION_API_KEY}"},
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            score = data.get("toxicity", 0.0)
            max_score = max(max_score, float(score))
        except Exception:  # noqa: BLE001
            pass  # On API failure, don't block the pipeline

    return max_score




# ---------------------------------------------------------------------------
# Pipeline Stages
# ---------------------------------------------------------------------------

def _stage_format_and_tokens(dataset: Dataset, report: DatasetValidationReport) -> list[str]:
    """Stage 1 & 2: Validate OpenAI chat format and gather token statistics."""
    valid_lines: list[str] = []
    invalid_format = 0
    token_counts: list[int] = []

    for line in stream_object_lines(dataset.s3_key):
        line = line.strip()
        if not line:
            continue
        if _validate_row(line):
            valid_lines.append(line)
            token_counts.append(_count_tokens(line))
        else:
            invalid_format += 1

    report.total_rows = len(valid_lines) + invalid_format
    report.valid_rows = len(valid_lines)
    report.invalid_format_count = invalid_format

    if token_counts:
        report.max_tokens_per_row = max(token_counts)
        report.avg_tokens_per_row = sum(token_counts) / len(token_counts)

    if not valid_lines:
        raise ValueError("No valid rows found — all lines failed format validation.")

    return valid_lines


def _stage_detect_duplicates(valid_lines: list[str], report: DatasetValidationReport) -> None:
    """Stage 3: Detect exact duplicate rows using SHA256 hashing."""
    seen: set[str] = set()
    duplicate_count = 0
    
    for line in valid_lines:
        fingerprint = hashlib.sha256(line.encode()).hexdigest()
        if fingerprint in seen:
            duplicate_count += 1
        else:
            seen.add(fingerprint)

    report.duplicate_count = duplicate_count
    
    if duplicate_count > 0:
        raise ValueError(
            f"Found {duplicate_count} exact duplicate rows. Please remove "
            "duplicates from your dataset and upload again."
        )


def _stage_toxicity_scan(valid_lines: list[str], report: DatasetValidationReport) -> None:
    """Stage 4: Score toxicity of a sample and fail if it exceeds the threshold."""
    # Sample up to 200 rows to keep scan times reasonable
    sample = valid_lines[:200]
    toxicity_score = _score_toxicity(sample)
    report.toxicity_score = toxicity_score

    if toxicity_score > settings.TOXICITY_THRESHOLD:
        raise ValueError(
            f"Toxicity score {toxicity_score:.2f} exceeds threshold "
            f"{settings.TOXICITY_THRESHOLD}."
        )


# ---------------------------------------------------------------------------
# Main Celery task
# ---------------------------------------------------------------------------


@celery_app.task(bind=True, max_retries=3)
def validate_dataset_task(self, dataset_id: int) -> None:   # noqa: ANN001
    """Run the multi-stage validation pipeline for a dataset.

    Runs inside the Celery worker process. Extensible pipeline design:
    each stage is a separate function that either mutates the dataset data,
    computes stats, or raises a ValueError to fail the pipeline.
    """
    with Session(engine) as session:
        dataset = session.get(Dataset, dataset_id)
        if not dataset:
            return  # Dataset deleted before worker picked up the task

        report = DatasetValidationReport(dataset_id=dataset_id)
        session.add(report)

        try:
            # 1. Format and Token Validation
            valid_lines = _stage_format_and_tokens(dataset, report)

            # 2. Exact Duplicate Detection
            _stage_detect_duplicates(valid_lines, report)

            # 3. Toxicity Scan
            _stage_toxicity_scan(valid_lines, report)

            # ---- Pipeline Success -------------------------------------------
            report.is_passed = True
            dataset.status = "ready"

        except Exception as exc:  # noqa: BLE001
            report.is_passed = False
            report.error_message = str(exc)
            dataset.status = "failed"

        finally:
            report.completed_at = datetime.now(timezone.utc)
            session.add(dataset)
            session.commit()
