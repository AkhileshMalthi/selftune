import hashlib
import json
import requests
import tiktoken
from worker import app
from config import settings
from storage import stream_object_lines

_tokenizer = None

def _get_tokenizer():
    global _tokenizer
    if _tokenizer is None:
        _tokenizer = tiktoken.get_encoding("cl100k_base")
    return _tokenizer

def _validate_row(line: str) -> bool:
    try:
        obj = json.loads(line)
    except Exception:
        return False
    messages = obj.get("messages")
    if not isinstance(messages, list) or not messages: return False
    for msg in messages:
        if not isinstance(msg, dict): return False
        if msg.get("role") not in {"system", "user", "assistant"}: return False
        if not isinstance(msg.get("content"), str): return False
    return True

def _count_tokens(line: str) -> int:
    return len(_get_tokenizer().encode(line, disallowed_special=()))

def _score_toxicity(texts: list[str]) -> float:
    if not texts:
        return 0.0
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
            score = resp.json().get("toxicity", 0.0)
            max_score = max(max_score, float(score))
        except Exception:
            pass
    return max_score

@app.task(bind=True, name="validate_dataset_task", max_retries=3)
def validate_dataset_task(self, payload: dict):
    dataset_id = payload.get("dataset_id")
    s3_key = payload.get("s3_key")
    if not dataset_id or not s3_key:
        return
        
    report = {
        "dataset_id": dataset_id,
        "is_passed": False,
        "error_message": "",
        "total_rows": 0,
        "valid_rows": 0,
        "invalid_format_count": 0,
        "max_tokens_per_row": 0,
        "avg_tokens_per_row": 0.0,
        "duplicate_count": 0,
        "toxicity_score": 0.0
    }
    
    try:
        valid_lines = []
        invalid_format = 0
        token_counts = []
        
        for line in stream_object_lines(s3_key):
            line = line.strip()
            if not line: continue
            if _validate_row(line):
                valid_lines.append(line)
                token_counts.append(_count_tokens(line))
            else:
                invalid_format += 1
                
        report["total_rows"] = len(valid_lines) + invalid_format
        report["valid_rows"] = len(valid_lines)
        report["invalid_format_count"] = invalid_format
        
        if token_counts:
            report["max_tokens_per_row"] = max(token_counts)
            report["avg_tokens_per_row"] = sum(token_counts) / len(token_counts)
            
        if not valid_lines:
            raise ValueError("No valid rows found - all lines failed format validation.")
            
        seen = set()
        duplicate_count = 0
        for line in valid_lines:
            fingerprint = hashlib.sha256(line.encode()).hexdigest()
            if fingerprint in seen:
                duplicate_count += 1
            else:
                seen.add(fingerprint)
        report["duplicate_count"] = duplicate_count
        if duplicate_count > 0:
            raise ValueError(f"Found {duplicate_count} exact duplicate rows. Please remove duplicates.")
            
        sample = valid_lines[:200]
        toxicity_score = _score_toxicity(sample)
        report["toxicity_score"] = toxicity_score
        if toxicity_score > settings.TOXICITY_THRESHOLD:
            raise ValueError(f"Toxicity score {toxicity_score:.2f} exceeds threshold {settings.TOXICITY_THRESHOLD}.")
            
        report["is_passed"] = True
    except Exception as exc:
        report["is_passed"] = False
        report["error_message"] = str(exc)
    
    # Callback Webhook
    headers = {"X-Webhook-Secret": settings.WEBHOOK_SECRET}
    callback_url = f"{settings.BACKEND_API_URL}/api/v1/datasets/{dataset_id}/validation_report"
    
    try:
        requests.post(callback_url, json=report, headers=headers)
    except Exception as e:
        print(f"Failed to post webhook back to API: {e}")
