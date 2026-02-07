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
    "qa-e2e-browser-audit",
    "qa-security",
    "qa-load",
    "devops",
    "context-sync",
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

    output_root = config.get("runtime", {}).get("output_root", "factory-workflow/bots/runtime/out")
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
    run_p.add_argument("--factory", default="factory-workflow", help="Factory root (default: factory-workflow)")
    run_p.add_argument("--project", default=None, help="Project path under /apps for dev bot")
    run_p.add_argument("--config", default="factory-workflow/bots/runtime/config.yaml", help="Runtime config path")

    kick_p = sub.add_parser("kickconfig", help="Interactive setup (MCP + local config)")
    kick_p.add_argument("--workspace", required=True, help="Workspace root path")
    kick_p.add_argument("--factory", default="factory-workflow", help="Factory root (default: factory-workflow)")

    daemon_p = sub.add_parser("daemon", help="Run a local job daemon (queue watcher)")
    daemon_p.add_argument("--workspace", required=True, help="Workspace root path")
    daemon_p.add_argument("--factory", default="factory-workflow", help="Factory root (default: factory-workflow)")
    daemon_p.add_argument("--config", default="factory-workflow/bots/runtime/config.yaml", help="Runtime config path")

    enqueue_p = sub.add_parser("enqueue", help="Create a job file in the runtime queue")
    enqueue_p.add_argument("bot", help="Bot name")
    enqueue_p.add_argument("--task", required=True, help="Task for the bot")
    enqueue_p.add_argument("--workspace", required=True, help="Workspace root path")
    enqueue_p.add_argument("--factory", default="factory-workflow", help="Factory root (default: factory-workflow)")
    enqueue_p.add_argument("--project", default=None, help="Project path under /apps for dev bot")
    enqueue_p.add_argument("--config", default="factory-workflow/bots/runtime/config.yaml", help="Runtime config path")

    ap_s = sub.add_parser("autopilot-start", help="Queue context-sync + planner (creates DRAFT plan)")
    ap_s.add_argument("--workspace", required=True, help="Workspace root path")
    ap_s.add_argument("--factory", default="factory-workflow", help="Factory root (default: factory-workflow)")
    ap_s.add_argument("--config", default="factory-workflow/bots/runtime/config.yaml", help="Runtime config path")
    ap_s.add_argument("--feature", default="current", help="Feature id (default: current)")

    ap_b = sub.add_parser("autopilot-build", help="Queue dev+qa after plan APPROVED")
    ap_b.add_argument("--workspace", required=True, help="Workspace root path")
    ap_b.add_argument("--factory", default="factory-workflow", help="Factory root (default: factory-workflow)")
    ap_b.add_argument("--config", default="factory-workflow/bots/runtime/config.yaml", help="Runtime config path")
    ap_b.add_argument("--feature", default="current", help="Feature id (default: current)")
    ap_b.add_argument("--project", required=True, help="Project path under /apps for dev bot")
    ap_b.add_argument("--with-e2e", action="store_true", help="Include qa-e2e in the pipeline")

    return parser


def daemon_cmd(args: argparse.Namespace) -> int:
    workspace = _resolve_path(args.workspace, Path.cwd())
    factory_root = _resolve_path(args.factory, workspace)
    config_path = _resolve_path(args.config, workspace)

    load_dotenv()
    config = load_config(config_path)

    output_root = config.get("runtime", {}).get("output_root", "factory-workflow/bots/runtime/out")
    output_root = _resolve_path(str(output_root), workspace)
    log_file = output_root / "runtime.log"

    logger = get_logger("daemon", str(log_file), level=str(config.get("runtime", {}).get("log_level", "INFO")))

    from shared.daemon import run_daemon
    from shared.jobs import Job

    queue_dir = Path(config.get("runtime", {}).get("queue_dir", "factory-workflow/bots/runtime/queue"))
    if not queue_dir.is_absolute():
        queue_dir = (workspace / queue_dir).resolve()

    processing_dir = queue_dir / ".processing"
    done_dir = queue_dir / ".done"
    failed_dir = queue_dir / ".failed"
    poll_seconds = float(config.get("daemon", {}).get("poll_seconds", 1.0))

    def _run_job(job: Job) -> int:
        # Map job -> run_cmd call
        ns = argparse.Namespace(
            bot=job.bot,
            task=job.task,
            workspace=job.workspace,
            factory=job.factory,
            project=job.project,
            config=job.config,
        )
        return run_cmd(ns)

    run_daemon(
        queue_dir=queue_dir,
        processing_dir=processing_dir,
        done_dir=done_dir,
        failed_dir=failed_dir,
        poll_seconds=poll_seconds,
        logger=logger,
        run_job_fn=_run_job,
    )
    return 0


def kickconfig_cmd(args: argparse.Namespace) -> int:
    workspace = _resolve_path(args.workspace, Path.cwd())
    factory_root = _resolve_path(args.factory, workspace)

    from shared.kickconfig import run_kickconfig

    run_kickconfig(workspace=workspace, factory_root=factory_root)
    return 0


def enqueue_cmd(args: argparse.Namespace) -> int:
    workspace = _resolve_path(args.workspace, Path.cwd())
    factory_root = _resolve_path(args.factory, workspace)
    config_path = _resolve_path(args.config, workspace)

    project_path = None
    if args.project:
        project_path = _resolve_path(args.project, workspace)

    load_dotenv()
    config = load_config(config_path)

    from shared.jobs import Job, write_job

    queue_dir = Path(config.get("runtime", {}).get("queue_dir", "factory-workflow/bots/runtime/queue"))
    if not queue_dir.is_absolute():
        queue_dir = (workspace / queue_dir).resolve()

    job = Job(
        action="run",
        bot=args.bot,
        task=args.task,
        workspace=str(workspace),
        factory=str(factory_root),
        project=str(project_path) if project_path else None,
        config=str(config_path),
        constraints={},
    )

    path = write_job(queue_dir, job, suffix=".json")
    print(str(path))
    return 0


def autopilot_start_cmd(args: argparse.Namespace) -> int:
    workspace = _resolve_path(args.workspace, Path.cwd())
    factory_root = _resolve_path(args.factory, workspace)
    config_path = _resolve_path(args.config, workspace)

    load_dotenv()
    config = load_config(config_path)

    queue_dir = Path(config.get("runtime", {}).get("queue_dir", "factory-workflow/bots/runtime/queue"))
    if not queue_dir.is_absolute():
        queue_dir = (workspace / queue_dir).resolve()

    from shared.autopilot import enqueue_start

    enqueue_start(
        workspace=workspace,
        factory_root=factory_root,
        config_path=config_path,
        queue_dir=queue_dir,
        feature=args.feature,
    )
    print(f"Queued: context-sync + planner (feature={args.feature})")
    return 0


def autopilot_build_cmd(args: argparse.Namespace) -> int:
    workspace = _resolve_path(args.workspace, Path.cwd())
    factory_root = _resolve_path(args.factory, workspace)
    config_path = _resolve_path(args.config, workspace)

    project_path = _resolve_path(args.project, workspace)

    load_dotenv()
    config = load_config(config_path)

    queue_dir = Path(config.get("runtime", {}).get("queue_dir", "factory-workflow/bots/runtime/queue"))
    if not queue_dir.is_absolute():
        queue_dir = (workspace / queue_dir).resolve()

    from shared.autopilot import enqueue_build

    try:
        enqueue_build(
            workspace=workspace,
            factory_root=factory_root,
            config_path=config_path,
            queue_dir=queue_dir,
            project_path=project_path,
            feature=args.feature,
            with_e2e=bool(args.with_e2e),
        )
    except Exception as exc:
        print(str(exc))
        return 2

    print(f"Queued: dev + qa + review (feature={args.feature})")
    return 0


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    if args.command == "run":
        return run_cmd(args)
    if args.command == "kickconfig":
        return kickconfig_cmd(args)
    if args.command == "daemon":
        return daemon_cmd(args)
    if args.command == "enqueue":
        return enqueue_cmd(args)
    if args.command == "autopilot-start":
        return autopilot_start_cmd(args)
    if args.command == "autopilot-build":
        return autopilot_build_cmd(args)

    return 1


if __name__ == "__main__":
    sys.exit(main())
