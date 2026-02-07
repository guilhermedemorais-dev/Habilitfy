import re
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class PlanApproval:
    status: str
    approver: Optional[str]


APPROVAL_RE = re.compile(r"^\s*-\s*Status:\s*(?P<status>[A-Z_]+)\s*$", re.MULTILINE)
APPROVER_RE = re.compile(r"^\s*-\s*Aprovador:\s*(?P<approver>.+?)\s*$", re.MULTILINE)


def parse_plan_approval(plan_text: str) -> PlanApproval:
    status_m = APPROVAL_RE.search(plan_text)
    approver_m = APPROVER_RE.search(plan_text)
    status = status_m.group("status") if status_m else "UNKNOWN"
    approver = approver_m.group("approver").strip() if approver_m else None
    return PlanApproval(status=status, approver=approver)


def is_plan_approved(plan_path: Path) -> bool:
    if not plan_path.exists():
        return False
    txt = plan_path.read_text(encoding="utf-8")
    appr = parse_plan_approval(txt)
    return appr.status.strip().upper() == "APPROVED"
