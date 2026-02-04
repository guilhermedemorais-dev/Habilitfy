import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from langchain_core.messages import HumanMessage, SystemMessage

from .context_loader import load_context_pack
from .fs import SafeFS
from .llm import build_llm
from .logger import log_event
from .prompt_loader import load_prompt
from .tools import build_filesystem_tools, build_mcp_tools

DOC_BOTS = {
    "orchestrator",
    "architect",
    "planner",
    "review",
    "qa-unit",
    "qa-integration",
    "qa-e2e",
    "qa-e2e-browser-audit",
    "qa-security",
    "qa-load",
    "devops",
}


@dataclass
class RunResult:
    status: str
    summary: str
    deliverables: List[Dict[str, str]]
    gaps: List[str]
    raw: str


def _now_id() -> str:
    return datetime.utcnow().strftime("%Y%m%d-%H%M%S")


def _parse_response(text: str) -> Dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass
    return {
        "status": "OK",
        "summary": "Unstructured response",
        "deliverables": [],
        "gaps": [],
    }


def _append_gaps(fs: SafeFS, gaps_path: Path, bot_name: str, task: str, gaps: Iterable[str]) -> None:
    ts = datetime.utcnow().isoformat() + "Z"
    entries = []
    for idx, gap in enumerate(gaps, start=1):
        entries.append(
            "\n".join(
                [
                    "",
                    f"ID: {bot_name}-{_now_id()}-{idx}",
                    f"Date: {ts}",
                    f"Source: runtime/{bot_name}",
                    f"Description: {gap}",
                    "Impact: BLOCKED",
                    "Needed decision: TBD",
                    "Owner: TBD",
                    "Status: open",
                ]
            )
        )
    content = "\n".join(entries) + "\n"
    existing = ""
    if fs.exists(gaps_path):
        existing = fs.read_text(gaps_path)
    fs.write_text(gaps_path, existing + content)


def run_bot(
    *,
    bot_name: str,
    task: str,
    workspace: Path,
    factory_root: Path,
    project_path: Optional[Path],
    config: Dict[str, Any],
    logger,
) -> RunResult:
    output_root = Path(config.get("runtime", {}).get("output_root", "factory/bots/runtime/out"))
    if not output_root.is_absolute():
        output_root = (workspace / output_root).resolve()
    run_id = _now_id()
    run_dir = output_root / run_id / bot_name

    factory_root = factory_root.resolve()
    allowed_roots = [factory_root, output_root]
    if bot_name == "dev":
        if not project_path:
            gaps_path = factory_root / "context" / "core" / "gaps.md"
            fs = SafeFS(allowed_roots=allowed_roots, base_dir=workspace)
            _append_gaps(
                fs,
                gaps_path,
                bot_name,
                task,
                ["Dev bot requires --project path under /apps/<project> to write code."],
            )
            return RunResult(
                status="BLOCKED",
                summary="Missing project path for dev bot",
                deliverables=[],
                gaps=["Missing --project path"],
                raw="",
            )
        project_path = project_path.resolve()
        allowed_roots.append(project_path)

    fs = SafeFS(allowed_roots=allowed_roots, base_dir=workspace)

    prompt = load_prompt(fs, bot_name, factory_root)

    index_path = factory_root / "context" / "INDEX.md"
    fallback_paths = [
        factory_root / "context" / "core" / "README.md",
        factory_root / "context" / "core" / "scope.md",
    ]

    context_pack = load_context_pack(
        fs,
        factory_root,
        index_path if fs.exists(index_path) else None,
        fallback_paths,
        max_files=int(config.get("runtime", {}).get("context_max_files", 20)),
        max_chars=int(config.get("runtime", {}).get("context_max_chars", 50000)),
    )

    path_rules = ""
    if bot_name == "dev":
        path_rules = f"Deliverables must be under: {project_path}"
    elif bot_name in DOC_BOTS:
        path_rules = f"Deliverables must be under: {factory_root}"
    else:
        path_rules = "Deliverables should be under factory or runtime/out"

    system_prompt = (
        f"You are the Factory bot '{bot_name}'.\n\n"
        f"Contract:\n{prompt}\n\n"
        f"Context pack (may be truncated={context_pack.truncated}):\n{context_pack.text}\n\n"
        "Return JSON with keys: status, summary, deliverables, gaps, notes.\n"
        "- status: OK or BLOCKED\n"
        "- deliverables: list of {path, content} using absolute paths\n"
        "- gaps: list of missing info questions\n"
        f"Path rules: {path_rules}\n"
        "If anything is missing or ambiguous, set status=BLOCKED and list gaps."
    )

    llm = build_llm(config)
    tools = build_filesystem_tools(fs) + build_mcp_tools(config)
    if tools:
        llm = llm.bind_tools(tools)

    messages = [SystemMessage(content=system_prompt), HumanMessage(content=task)]
    response = llm.invoke(messages)
    text = response.content if hasattr(response, "content") else str(response)

    parsed = _parse_response(text)
    result = RunResult(
        status=str(parsed.get("status", "OK")),
        summary=str(parsed.get("summary", "")),
        deliverables=list(parsed.get("deliverables", []) or []),
        gaps=list(parsed.get("gaps", []) or []),
        raw=text,
    )

    run_fs = SafeFS(allowed_roots=[output_root], base_dir=workspace)
    run_fs.write_text(run_dir / "response.txt", text)
    run_fs.write_text(
        run_dir / "summary.md",
        f"# {bot_name} run\n\nStatus: {result.status}\n\n{result.summary}\n",
    )

    for item in result.deliverables:
        path = item.get("path")
        content = item.get("content", "")
        if not path:
            continue
        try:
            fs.write_text(path, content)
        except PermissionError as exc:
            result.status = "BLOCKED"
            result.gaps.append(str(exc))

    if result.gaps:
        gaps_path = factory_root / "context" / "core" / "gaps.md"
        _append_gaps(fs, gaps_path, bot_name, task, result.gaps)
        result.status = "BLOCKED"

    log_event(logger, "run_complete", bot=bot_name, status=result.status, output=str(run_dir))
    return result
