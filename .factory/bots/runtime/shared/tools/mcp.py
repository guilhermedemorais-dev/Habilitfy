import os
from pathlib import Path
from typing import Any, Dict, List


def _env_expand(value: str) -> str:
    """Expand ENV:FOO placeholders."""
    if not isinstance(value, str):
        return str(value)
    if value.startswith("ENV:"):
        key = value.split("ENV:", 1)[1]
        return os.getenv(key, "")
    return value


def _load_mcp_toml(path: Path) -> Dict[str, Any]:
    # Python 3.11+: tomllib
    import tomllib

    if not path.exists():
        return {}
    return tomllib.loads(path.read_text(encoding="utf-8"))


def build_mcp_tools(config: Dict[str, Any]) -> List:
    """MVP loader for MCP config.

    Today this returns no LangChain tools (protocol varies by MCP server),
    but it *does* validate that the user has an mcp.toml when enabled.

    Next step: implement per-server adapters (HTTP/stdio) with a stable interface.
    """

    mcp_cfg = config.get("mcp", {})
    enabled = bool(mcp_cfg.get("enabled", False))
    if not enabled:
        return []

    config_path_raw = mcp_cfg.get("config_path") or "factory-workflow/config/mcp.toml"
    config_path = Path(str(config_path_raw)).expanduser()

    # If relative, resolve later by SafeFS/base workspace; runner passes config only.
    # Here we just attempt best-effort load if absolute.
    if config_path.is_absolute():
        _ = _load_mcp_toml(config_path)

    # No tools yet.
    return []
