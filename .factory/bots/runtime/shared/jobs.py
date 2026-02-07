import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


@dataclass
class Job:
    action: str
    bot: str
    task: str
    workspace: str
    factory: str = "factory-workflow"
    project: Optional[str] = None
    config: str = "factory-workflow/bots/runtime/config.yaml"
    constraints: Optional[Dict[str, Any]] = None


def now_id() -> str:
    return datetime.utcnow().strftime("%Y%m%d-%H%M%S")


def load_job(path: Path) -> Job:
    raw = path.read_text(encoding="utf-8")
    if path.suffix.lower() in {".yaml", ".yml"}:
        data = yaml.safe_load(raw) or {}
    else:
        data = json.loads(raw)

    return Job(
        action=str(data.get("action", "run")),
        bot=str(data.get("bot")),
        task=str(data.get("task")),
        workspace=str(data.get("workspace")),
        factory=str(data.get("factory", "factory-workflow")),
        project=data.get("project"),
        config=str(data.get("config", "factory-workflow/bots/runtime/config.yaml")),
        constraints=data.get("constraints"),
    )


def dump_job(job: Job) -> Dict[str, Any]:
    return {
        "action": job.action,
        "bot": job.bot,
        "task": job.task,
        "workspace": job.workspace,
        "factory": job.factory,
        "project": job.project,
        "config": job.config,
        "constraints": job.constraints or {},
    }


def write_job(queue_dir: Path, job: Job, *, suffix: str = ".json") -> Path:
    queue_dir.mkdir(parents=True, exist_ok=True)
    name = f"{now_id()}-{job.bot}{suffix}"
    path = queue_dir / name
    data = dump_job(job)
    if suffix in {".yaml", ".yml"}:
        path.write_text(yaml.safe_dump(data, sort_keys=False), encoding="utf-8")
    else:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    return path


def normalize_jobs(items: Any) -> List[Job]:
    if not items:
        return []
    if not isinstance(items, list):
        return []

    jobs: List[Job] = []
    for it in items:
        if not isinstance(it, dict):
            continue
        bot = it.get("bot")
        task = it.get("task")
        workspace = it.get("workspace")
        if not bot or not task or not workspace:
            continue
        jobs.append(
            Job(
                action=str(it.get("action", "run")),
                bot=str(bot),
                task=str(task),
                workspace=str(workspace),
                factory=str(it.get("factory", "factory-workflow")),
                project=it.get("project"),
                config=str(it.get("config", "factory-workflow/bots/runtime/config.yaml")),
                constraints=it.get("constraints") if isinstance(it.get("constraints"), dict) else None,
            )
        )
    return jobs
