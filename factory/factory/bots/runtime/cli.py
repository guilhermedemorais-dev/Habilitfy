import argparse
import importlib
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from dotenv import load_dotenv

from shared.llm import load_config
from shared.logger import get_logger


BOT_NAMES = {
    "orchestrator",
    "architect",
    "planner",
    "dev",
    "review",
    "qa-unit",
    "qa-integration",
    "qa-e2e",
    "qa-security",
    "qa-load",
    "devops",
}


def _resolve_path(path: str, base: Path) -> Path:
    p = Path(path)
    if not p.is_absolute():
        p = base / p
    return p.resolve()


def run_cmd(args: argparse.Namespace) -> int:
    workspace = _resolve_path(args.workspace, Path.cwd())
    factory_root = _resolve_path(args.factory, workspace)
    config_path = _resolve_path(args.config, workspace)

    project_path = None
    if args.project:
        project_path = _resolve_path(args.project, workspace)

    load_dotenv()
    config = load_config(config_path)

    output_root = config.get("runtime", {}).get("output_root", "factory/bots/runtime/out")
    output_root = _resolve_path(str(output_root), workspace)
    log_file = output_root / "runtime.log"

    logger = get_logger("runtime", str(log_file), level=str(config.get("runtime", {}).get("log_level", "INFO")))

    if args.bot not in BOT_NAMES:
        raise ValueError(f"Unknown bot: {args.bot}. Allowed: {sorted(BOT_NAMES)}")

    module = importlib.import_module(f"bots.{args.bot}")
    result = module.run(
        task=args.task,
        workspace=workspace,
        factory_root=factory_root,
        project_path=project_path,
        config=config,
        logger=logger,
    )

    if result.status == "BLOCKED":
        return 2
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Factory runtime CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    run_p = sub.add_parser("run", help="Run a bot")
    run_p.add_argument("bot", help="Bot name")
    run_p.add_argument("--task", required=True, help="Task for the bot")
    run_p.add_argument("--workspace", required=True, help="Workspace root path")
    run_p.add_argument("--factory", default="factory", help="Factory root (default: factory)")
    run_p.add_argument("--project", default=None, help="Project path under /apps for dev bot")
    run_p.add_argument("--config", default="factory/bots/runtime/config.yaml", help="Runtime config path")

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    if args.command == "run":
        return run_cmd(args)
    return 1


if __name__ == "__main__":
    sys.exit(main())
