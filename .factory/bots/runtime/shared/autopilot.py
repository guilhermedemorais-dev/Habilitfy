from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from .jobs import Job, write_job
from .approval import is_plan_approved


@dataclass
class AutopilotPaths:
    plan_dir: Path
    plan_path: Path
    research_path: Path


def default_paths(workspace: Path) -> AutopilotPaths:
    plan_dir = workspace / "factory-workflow" / "docs" / "autopilot" / "current"
    return AutopilotPaths(
        plan_dir=plan_dir,
        plan_path=plan_dir / "plan.md",
        research_path=plan_dir / "research.md",
    )


def enqueue_start(
    *,
    workspace: Path,
    factory_root: Path,
    config_path: Path,
    queue_dir: Path,
    feature: str = "current",
) -> Path:
    """Enqueue context-sync + planner.

    Planner is instructed to write a DRAFT plan to the canonical autopilot path.
    """

    # Canonical paths
    plan_dir = workspace / str(factory_root) / "docs" / "autopilot" / feature
    plan_path = plan_dir / "plan.md"
    research_path = plan_dir / "research.md"

    # 1) context sync (docs -> context)
    job1 = Job(
        action="run",
        bot="context-sync",
        task="Distribuir PRDs de ./docs para factory-workflow/context (sem inventar; se faltar, registrar GAP e parar).",
        workspace=str(workspace),
        factory=str(factory_root),
        project=None,
        config=str(config_path),
        constraints={"read_only": False},
    )

    # 2) planner
    job2 = Job(
        action="run",
        bot="planner",
        task=(
            "Gerar Research + Plan para o trabalho atual. "
            f"Escreva os arquivos em: {plan_dir}. "
            f"Obrigatório criar: {research_path} e {plan_path}. "
            "No topo do plan.md, incluir '## Aprovação do Plan' com Status: DRAFT. "
            "Não iniciar implementação. Se faltar info, registrar GAP e retornar BLOCKED."
        ),
        workspace=str(workspace),
        factory=str(factory_root),
        project=None,
        config=str(config_path),
        constraints={"read_only": False},
    )

    # write jobs
    p1 = write_job(queue_dir, job1, suffix=".json")
    write_job(queue_dir, job2, suffix=".json")
    return p1


def enqueue_build(
    *,
    workspace: Path,
    factory_root: Path,
    config_path: Path,
    queue_dir: Path,
    project_path: Path,
    feature: str = "current",
    with_e2e: bool = False,
) -> None:
    """Enqueue dev + qa after plan approval."""

    plan_dir = workspace / str(factory_root) / "docs" / "autopilot" / feature
    plan_path = plan_dir / "plan.md"

    if not is_plan_approved(plan_path):
        raise RuntimeError(f"Plan not approved yet: {plan_path}")

    dev_job = Job(
        action="run",
        bot="dev",
        task=(
            "Implementar a feature atual seguindo estritamente o plan aprovado. "
            f"Plan: {plan_path}. "
            "Atualize código + testes + docs necessárias. "
            "Se encontrar gap, registrar e parar."
        ),
        workspace=str(workspace),
        factory=str(factory_root),
        project=str(project_path),
        config=str(config_path),
        constraints={},
    )

    qa_unit_job = Job(
        action="run",
        bot="qa-unit",
        task="Executar testes unitários conforme plan e registrar evidências em runtime/out.",
        workspace=str(workspace),
        factory=str(factory_root),
        project=None,
        config=str(config_path),
        constraints={},
    )

    qa_integration_job = Job(
        action="run",
        bot="qa-integration",
        task="Executar testes de integração conforme plan e registrar evidências em runtime/out.",
        workspace=str(workspace),
        factory=str(factory_root),
        project=None,
        config=str(config_path),
        constraints={},
    )

    qa_security_job = Job(
        action="run",
        bot="qa-security",
        task="Rodar auditorias de segurança conforme plan e registrar evidências em runtime/out.",
        workspace=str(workspace),
        factory=str(factory_root),
        project=None,
        config=str(config_path),
        constraints={},
    )

    qa_e2e_job = None
    if with_e2e:
        qa_e2e_job = Job(
            action="run",
            bot="qa-e2e",
            task="Executar testes E2E conforme plan e registrar evidências em runtime/out.",
            workspace=str(workspace),
            factory=str(factory_root),
            project=None,
            config=str(config_path),
            constraints={},
        )

    review_job = Job(
        action="run",
        bot="review",
        task=(
            "Revisar entrega vs plan/DoD e gerar release checklist. "
            f"Escreva um arquivo: {plan_dir / 'release.md'}. "
            "Inclua: resumo, status (GO/NO-GO), lista de evidências (paths em runtime/out), riscos, e próximos passos (commit/push/deploy humano)."
        ),
        workspace=str(workspace),
        factory=str(factory_root),
        project=None,
        config=str(config_path),
        constraints={},
    )

    write_job(queue_dir, dev_job, suffix=".json")
    write_job(queue_dir, qa_unit_job, suffix=".json")
    write_job(queue_dir, qa_integration_job, suffix=".json")
    if qa_e2e_job is not None:
        write_job(queue_dir, qa_e2e_job, suffix=".json")
    write_job(queue_dir, qa_security_job, suffix=".json")
    write_job(queue_dir, review_job, suffix=".json")
