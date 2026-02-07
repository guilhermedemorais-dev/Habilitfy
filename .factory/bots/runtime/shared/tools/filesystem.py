from typing import List

from langchain_core.tools import tool

from ..fs import SafeFS


def build_filesystem_tools(fs: SafeFS) -> List:
    @tool("read_file")
    def read_file(path: str) -> str:
        """Read a text file from an allowed path."""
        return fs.read_text(path)

    @tool("write_file")
    def write_file(path: str, content: str) -> str:
        """Write a text file to an allowed path."""
        fs.write_text(path, content)
        return f"Wrote {path}"

    return [read_file, write_file]
