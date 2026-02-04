import os
from configparser import ConfigParser
from pathlib import Path
from typing import Any, Dict, Optional

from shared.fs import SafeFS
from shared.runner import RunResult, _append_gaps, run_bot


def _mcp_config_path(factory_root: Path) -> Path:
    override = os.getenv("FACTORY_MCP_CONFIG")
    if override:
        return Path(override)
    return factory_root / "config" / "mcp.toml"


def _validate_chrome_devtools(factory_root: Path) -> list[str]:
    mcp_path = _mcp_config_path(factory_root)
    if not mcp_path.exists():
        return [f"MCP config nao encontrado em {mcp_path}."]

    parser = ConfigParser(interpolation=None)
    parser.read(mcp_path)
    if not parser.has_section("chrome_devtools"):
        return ["Secao [chrome_devtools] nao encontrada no mcp.toml."]

    enabled = parser.getboolean("chrome_devtools", "enabled", fallback=False)
    if not enabled:
        return ["chrome_devtools MCP esta desabilitado no mcp.toml."]

    return []


def run(
    *,
    task: str,
    workspace: Path,
    factory_root: Path,
    project_path: Optional[Path],
    config: Dict[str, Any],
    logger,
):
    gaps = _validate_chrome_devtools(factory_root)
    if gaps:
        fs = SafeFS(allowed_roots=[factory_root], base_dir=workspace)
        gaps_path = factory_root / "context" / "core" / "gaps.md"
        _append_gaps(fs, gaps_path, "qa-e2e-browser-audit", task, gaps)
        return RunResult(
            status="BLOCKED",
            summary="Chrome DevTools MCP nao configurado",
            deliverables=[],
            gaps=gaps,
            raw="",
        )

    return run_bot(
        bot_name="qa-e2e-browser-audit",
        task=task,
        workspace=workspace,
        factory_root=factory_root,
        project_path=project_path,
        config=config,
        logger=logger,
    )
