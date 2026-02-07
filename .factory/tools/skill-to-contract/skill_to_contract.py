#!/usr/bin/env python3
import argparse
import json
import re
from datetime import date
from pathlib import Path

HEADING_RE = re.compile(r"^#{1,6}\s+(.*)$")

SECTION_ALIASES = {
    "capabilities": ["capabilities", "capability"],
    "patterns": ["patterns", "pattern", "best practices"],
    "anti_patterns": ["anti-patterns", "anti patterns", "antipatterns", "sharp edges"],
    "inputs": ["inputs", "input"],
    "outputs": ["outputs", "output"],
    "requirements": ["requirements", "prerequisites"],
    "related_skills": ["related skills", "related"],
}

HIGH_RISK_KEYWORDS = {
    "security",
    "auth",
    "payment",
    "encryption",
    "prod",
    "deploy",
    "infra",
    "database",
    "migration",
    "secret",
    "token",
}

MED_RISK_KEYWORDS = {
    "performance",
    "scale",
    "cache",
    "cost",
    "availability",
    "reliability",
    "compliance",
}

IMPACT_KEYWORDS = HIGH_RISK_KEYWORDS | MED_RISK_KEYWORDS | {
    "revenue",
    "growth",
    "latency",
    "uptime",
    "customer",
}


def normalize_heading(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    return text or "skill"


def extract_list(lines):
    items = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith(("- ", "* ")):
            items.append(stripped[2:].strip())
    return items


def first_paragraph(lines):
    buffer = []
    for line in lines:
        if line.strip() == "":
            if buffer:
                break
            continue
        buffer.append(line.strip())
    return " ".join(buffer).strip()


def map_section(sections, key):
    aliases = SECTION_ALIASES[key]
    for alias in aliases:
        if alias in sections:
            return extract_list(sections[alias])
    return []


def classify(text_blob, capabilities, patterns, anti_patterns, requirements, related):
    lower = text_blob.lower()
    risk = "low"
    if any(word in lower for word in HIGH_RISK_KEYWORDS) or anti_patterns:
        risk = "high"
    elif any(word in lower for word in MED_RISK_KEYWORDS):
        risk = "medium"

    impact = "low"
    if any(word in lower for word in IMPACT_KEYWORDS):
        impact = "high"
    elif len(capabilities) + len(patterns) > 4:
        impact = "medium"

    cognitive_cost = "low"
    if len(capabilities) + len(patterns) + len(requirements) > 8:
        cognitive_cost = "high"
    elif len(capabilities) + len(patterns) > 4:
        cognitive_cost = "medium"

    parallelism = "high"
    if related or requirements or risk == "high":
        parallelism = "limited"

    return {
        "risk": risk,
        "impact": impact,
        "cognitive_cost": cognitive_cost,
        "parallelism": parallelism,
    }


def build_checklist(prefix, items):
    return [f"{prefix}: {item}" for item in items]


def build_validation_rules(anti_patterns, requirements):
    rules = []
    for item in anti_patterns:
        rules.append(f"Block if {item}")
    for item in requirements:
        rules.append(f"Block if requirement missing: {item}")
    return rules


def generate_plan_template(patterns, outputs):
    template = [
        "Scope and boundaries",
        "Files and modules to change",
        "Implementation steps",
        "Test plan and QA gates",
        "Rollback and rollout plan",
    ]
    for pattern in patterns:
        template.append(f"Apply pattern: {pattern}")
    for output in outputs:
        template.append(f"Deliverable: {output}")
    return template


def yaml_scalar(value):
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, str):
        needs_quote = value == "" or any(ch in value for ch in [":", "#", "{", "}", "[", "]", "\n"]) or value.strip() != value
        if needs_quote:
            return json.dumps(value)
        return value
    return json.dumps(value)


def to_yaml(value, indent=0):
    spacer = "  " * indent
    if isinstance(value, dict):
        lines = []
        for key, val in value.items():
            if isinstance(val, (dict, list)):
                lines.append(f"{spacer}{key}:")
                lines.append(to_yaml(val, indent + 1))
            else:
                lines.append(f"{spacer}{key}: {yaml_scalar(val)}")
        return "\n".join(lines)
    if isinstance(value, list):
        lines = []
        for item in value:
            if isinstance(item, (dict, list)):
                lines.append(f"{spacer}-")
                lines.append(to_yaml(item, indent + 1))
            else:
                lines.append(f"{spacer}- {yaml_scalar(item)}")
        return "\n".join(lines)
    return f"{spacer}{yaml_scalar(value)}"


def parse_skill(text: str):
    title = ""
    sections = {"preamble": []}
    current = "preamble"

    for line in text.splitlines():
        match = HEADING_RE.match(line)
        if match:
            heading_text = match.group(1).strip()
            if not title:
                title = heading_text
            current = normalize_heading(heading_text)
            sections.setdefault(current, [])
        else:
            sections.setdefault(current, []).append(line.rstrip())

    summary = first_paragraph(sections.get("preamble", []))
    skill_id = slugify(title or "skill")

    capabilities = map_section(sections, "capabilities")
    patterns = map_section(sections, "patterns")
    anti_patterns = map_section(sections, "anti_patterns")
    inputs = map_section(sections, "inputs")
    outputs = map_section(sections, "outputs")
    requirements = map_section(sections, "requirements")
    related_skills = map_section(sections, "related_skills")

    text_blob = " ".join([title, summary, " ".join(capabilities), " ".join(patterns)])
    classifications = classify(
        text_blob, capabilities, patterns, anti_patterns, requirements, related_skills
    )

    research_checklist = []
    research_checklist.extend(build_checklist("Confirm capability", capabilities))
    research_checklist.extend(build_checklist("Validate pattern", patterns))
    research_checklist.extend(build_checklist("Verify requirement", requirements))

    plan_template = generate_plan_template(patterns, outputs)
    validation_rules = build_validation_rules(anti_patterns, requirements)

    contract = {
        "skill_id": skill_id,
        "title": title,
        "summary": summary,
        "capabilities": capabilities,
        "patterns": patterns,
        "anti_patterns": anti_patterns,
        "inputs": inputs,
        "outputs": outputs,
        "requirements": requirements,
        "related_skills": related_skills,
        "research_checklist": research_checklist,
        "plan_template": plan_template,
        "validation_rules": validation_rules,
        "classifications": classifications,
        "raw_sections": sections,
        "generated_at": date.today().isoformat(),
    }

    return contract


def main():
    parser = argparse.ArgumentParser(description="Convert SKILL.md to a contract.")
    parser.add_argument("--input", required=True, help="Path to SKILL.md")
    parser.add_argument("--output", required=True, help="Output path")
    parser.add_argument(
        "--format",
        choices=["yaml", "json"],
        default="yaml",
        help="Output format",
    )
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    text = input_path.read_text(encoding="utf-8")
    contract = parse_skill(text)

    if args.format == "json":
        output_path.write_text(json.dumps(contract, indent=2) + "\n", encoding="utf-8")
    else:
        output_path.write_text(to_yaml(contract) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
