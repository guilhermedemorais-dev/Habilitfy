from typing import Any, Dict, List


def build_mcp_tools(config: Dict[str, Any]) -> List:
    mcp_cfg = config.get("mcp", {})
    enabled = bool(mcp_cfg.get("enabled", False))
    if not enabled:
        return []

    # Placeholder for MCP integration. Intentionally returns no tools
    # until an MCP client is configured.
    return []
