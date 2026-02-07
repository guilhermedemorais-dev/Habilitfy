import time
from pathlib import Path
from typing import Any, Dict, Optional

from .jobs import Job, load_job


def _atomic_move(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    src.replace(dst)


def run_daemon(
    *,
    queue_dir: Path,
    processing_dir: Path,
    done_dir: Path,
    failed_dir: Path,
    poll_seconds: float,
    logger,
    run_job_fn,
) -> None:
    """Simple polling daemon.

    - Watches queue_dir for *.json|*.yaml jobs
    - Moves to processing_dir while executing
    - Moves to done_dir or failed_dir when finished

    run_job_fn(job) must return an int (0 ok, non-zero fail).
    """

    queue_dir.mkdir(parents=True, exist_ok=True)
    processing_dir.mkdir(parents=True, exist_ok=True)
    done_dir.mkdir(parents=True, exist_ok=True)
    failed_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"daemon listening queue_dir={queue_dir}")

    while True:
        jobs = sorted(
            [
                *queue_dir.glob("*.json"),
                *queue_dir.glob("*.yaml"),
                *queue_dir.glob("*.yml"),
            ],
            key=lambda p: p.name,
        )

        if not jobs:
            time.sleep(poll_seconds)
            continue

        for job_path in jobs:
            try:
                job: Job = load_job(job_path)
                processing_path = processing_dir / job_path.name
                _atomic_move(job_path, processing_path)

                logger.info(f"job start: {processing_path.name} bot={job.bot}")
                rc = run_job_fn(job)

                if rc == 0:
                    _atomic_move(processing_path, done_dir / processing_path.name)
                    logger.info(f"job done: {processing_path.name}")
                else:
                    _atomic_move(processing_path, failed_dir / processing_path.name)
                    logger.error(f"job failed: {processing_path.name} rc={rc}")

            except Exception as exc:
                logger.exception(f"job crash: {job_path.name}: {exc}")
                # best-effort move to failed
                try:
                    if job_path.exists():
                        _atomic_move(job_path, failed_dir / job_path.name)
                except Exception:
                    pass

        # small delay between batches
        time.sleep(0.1)
