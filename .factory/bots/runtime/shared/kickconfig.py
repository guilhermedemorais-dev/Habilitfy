from pathlib import Path


def _prompt_bool(question: str, default: bool) -> bool:
    d = "Y/n" if default else "y/N"
    while True:
        raw = input(f"{question} [{d}]: ").strip().lower()
        if not raw:
            return default
        if raw in {"y", "yes", "s", "sim"}:
            return True
        if raw in {"n", "no", "nao", "não"}:
            return False
        print("Responda com y/n.")


def _prompt_str(question: str, default: str = "") -> str:
    raw = input(f"{question}{f' [{default}]' if default else ''}: ").strip()
    return raw if raw else default


def run_kickconfig(*, workspace: Path, factory_root: Path) -> Path:
    """Interactive config wizard.

    Generates factory-workflow/config/mcp.toml (local, gitignored) based on mcp.example.toml.
    """

    template = factory_root / "config" / "mcp.example.toml"
    target = factory_root / "config" / "mcp.toml"

    if not template.exists():
        raise FileNotFoundError(f"Missing MCP template: {template}")

    print("\nFactory — kickconfig (MCP)\n")
    print("Isso vai criar/atualizar o arquivo local:")
    print(f"  {target}\n")

    enable_context7 = _prompt_bool("Habilitar Context7 (docs/research)?", True)
    enable_github = _prompt_bool("Habilitar GitHub (issues/PRs/refs)?", False)
    enable_shadcn = _prompt_bool("Habilitar shadcn registry (UI components)?", False)
    enable_playwright = _prompt_bool("Habilitar Playwright (e2e)?", False)
    enable_chrome = _prompt_bool("Habilitar Chrome DevTools MCP (browser audit)?", False)
    enable_sec = _prompt_bool("Habilitar MCP Security Audit?", False)

    # We keep ENV:* placeholders by default. For internal use, let user pick names.
    context7_token = _prompt_str("ENV var para Context7 token", "CONTEXT7_TOKEN")
    github_token = _prompt_str("ENV var para GitHub token", "GITHUB_TOKEN")

    chrome_endpoint = _prompt_str("ENV var para Chrome DevTools endpoint", "CHROME_DEVTOOLS_ENDPOINT")

    lines: list[str] = []
    lines.append("# MCP config (local) — NAO versionar\n")
    lines.append("# Gerado por: factory runtime kickconfig\n")
    lines.append("\n")

    lines.append("[context7]\n")
    lines.append(f"enabled = {'true' if enable_context7 else 'false'}\n")
    lines.append('base_url = "https://context7.com"\n')
    lines.append(f'token = "ENV:{context7_token}"\n')
    lines.append("\n")

    lines.append("[github]\n")
    lines.append(f"enabled = {'true' if enable_github else 'false'}\n")
    lines.append('base_url = "https://api.github.com"\n')
    lines.append(f'token = "ENV:{github_token}"\n')
    lines.append("\n")

    lines.append("[shadcn_registry]\n")
    lines.append(f"enabled = {'true' if enable_shadcn else 'false'}\n")
    lines.append('base_url = "ENV:SHADCN_REGISTRY_URL"\n')
    lines.append("\n")

    lines.append("[playwright]\n")
    lines.append(f"enabled = {'true' if enable_playwright else 'false'}\n")
    lines.append('endpoint = "ENV:PLAYWRIGHT_ENDPOINT"\n')
    lines.append("\n")

    lines.append("[chrome_devtools]\n")
    lines.append(f"enabled = {'true' if enable_chrome else 'false'}\n")
    lines.append(f'endpoint = "ENV:{chrome_endpoint}"\n')
    lines.append('executable = "ENV:CHROME_DEVTOOLS_EXECUTABLE"\n')
    lines.append('browser_channel = "ENV:CHROME_DEVTOOLS_CHANNEL"\n')
    lines.append('headless = "ENV:CHROME_DEVTOOLS_HEADLESS"\n')
    lines.append('output_dir = "ENV:CHROME_DEVTOOLS_OUTPUT_DIR"\n')
    lines.append("\n")

    lines.append("[mcp_security_audit]\n")
    lines.append(f"enabled = {'true' if enable_sec else 'false'}\n")
    lines.append('endpoint = "ENV:MCP_SECURITY_AUDIT_ENDPOINT"\n')
    lines.append('token = "ENV:MCP_SECURITY_AUDIT_TOKEN"\n')
    lines.append("\n")

    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text("".join(lines), encoding="utf-8")

    print("\nOK. Arquivo gerado:")
    print(f"  {target}")
    print("\nPróximo: exporte as ENV vars no seu .env (ou shell) e rode os bots.")

    return target
