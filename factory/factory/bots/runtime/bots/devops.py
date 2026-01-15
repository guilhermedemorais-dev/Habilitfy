from pathlib import Path
from typing import Any, Dict, Optional

from shared.runner import run_bot


def run(
    *,
    task: str,
    workspace: Path,
    factory_root: Path,
    project_path: Optional[Path],
    config: Dict[str, Any],
    logger,
):
    return run_bot(
        bot_name="devops",
        task=task,
        workspace=workspace,
        factory_root=factory_root,
        project_path=project_path,
        config=config,
        logger=logger,
    )
