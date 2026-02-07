from pathlib import Path

from .fs import SafeFS


def load_prompt(fs: SafeFS, bot_name: str, factory_root: Path) -> str:
    prompt_path = factory_root / "bots" / f"{bot_name}.md"
    if not fs.exists(prompt_path):
        raise FileNotFoundError(f"Bot prompt not found: {prompt_path}")
    return fs.read_text(prompt_path)
