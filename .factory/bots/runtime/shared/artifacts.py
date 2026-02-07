import json
from dataclasses import asdict
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from .jobs import Job, dump_job


def write_artifacts(
    *,
    run_dir: Path,
    bot_name: str,
    status: str,
    summary: str,
    deliverables: List[Dict[str, Any]],
    gaps: List[str],
    jobs: List[Job],
    raw_response_path: Path,
) -> Path:
    """Write machine-readable output for a run.

    This is the stable contract that CI/other tools can consume.
    """

    payload: Dict[str, Any] = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "bot": bot_name,
        "status": status,
        "summary": summary,
        "deliverables": deliverables,
        "gaps": gaps,
        "jobs": [dump_job(j) for j in jobs],
        "raw_response": str(raw_response_path),
    }

    out = run_dir / "artifacts.json"
    out.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    return out
