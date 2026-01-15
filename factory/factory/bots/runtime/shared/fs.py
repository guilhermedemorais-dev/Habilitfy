import os
from pathlib import Path
from typing import Iterable, Optional


class SafeFS:
    def __init__(self, allowed_roots: Iterable[str | Path], base_dir: Optional[str | Path] = None):
        self.allowed_roots = [Path(p).resolve() for p in allowed_roots]
        self.base_dir = Path(base_dir).resolve() if base_dir else None

    def _resolve(self, path: str | Path) -> Path:
        p = Path(path)
        if not p.is_absolute():
            base = self.base_dir or Path.cwd()
            p = base / p
        return p.resolve()

    def _is_allowed(self, path: Path) -> bool:
        for root in self.allowed_roots:
            if path == root:
                return True
            if str(path).startswith(str(root) + os.sep):
                return True
        return False

    def _ensure_allowed(self, path: Path) -> None:
        if not self._is_allowed(path):
            roots = ", ".join(str(r) for r in self.allowed_roots)
            raise PermissionError(f"Path not allowed: {path}. Allowed roots: {roots}")

    def read_text(self, path: str | Path, encoding: str = "utf-8") -> str:
        resolved = self._resolve(path)
        self._ensure_allowed(resolved)
        return resolved.read_text(encoding=encoding)

    def write_text(self, path: str | Path, content: str, encoding: str = "utf-8") -> None:
        resolved = self._resolve(path)
        self._ensure_allowed(resolved)
        resolved.parent.mkdir(parents=True, exist_ok=True)
        resolved.write_text(content, encoding=encoding)

    def exists(self, path: str | Path) -> bool:
        resolved = self._resolve(path)
        self._ensure_allowed(resolved)
        return resolved.exists()
