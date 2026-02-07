import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional

from .fs import SafeFS

PATH_RE = re.compile(r"(?:factory-workflow/)?[A-Za-z0-9_./-]+\.md")


@dataclass
class ContextFile:
    path: str
    content: str


@dataclass
class ContextPack:
    files: List[ContextFile]
    text: str
    truncated: bool


def _extract_paths(text: str, base_dir: Path, factory_root: Path) -> List[Path]:
    paths: List[Path] = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            continue
        matches = PATH_RE.findall(line)
        for match in matches:
            raw = match.strip("` ")
            if raw.startswith("factory-workflow/"):
                p = factory_root / raw.split("factory-workflow/")[1]
            elif raw.startswith("context/"):
                p = factory_root / raw
            else:
                p = base_dir / raw
            paths.append(p)
    return paths


def load_context_pack(
    fs: SafeFS,
    factory_root: Path,
    index_path: Optional[Path],
    fallback_paths: Iterable[Path],
    max_files: int = 20,
    max_chars: int = 50000,
) -> ContextPack:
    files: List[ContextFile] = []
    total_chars = 0
    truncated = False

    def _add_file(path: Path) -> None:
        nonlocal total_chars, truncated
        if len(files) >= max_files:
            truncated = True
            return
        if not fs.exists(path):
            return
        content = fs.read_text(path)
        total_chars += len(content)
        if total_chars > max_chars:
            truncated = True
            return
        files.append(ContextFile(path=str(path), content=content))

    if index_path and fs.exists(index_path):
        index_text = fs.read_text(index_path)
        _add_file(index_path)
        base_dir = index_path.parent
        for p in _extract_paths(index_text, base_dir, factory_root):
            _add_file(p)
    else:
        for p in fallback_paths:
            _add_file(p)

    parts = []
    for f in files:
        parts.append(f"# {f.path}\n\n{f.content}")
    text = "\n\n".join(parts)

    return ContextPack(files=files, text=text, truncated=truncated)
