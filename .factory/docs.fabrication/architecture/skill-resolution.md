# Skill Resolution

This document maps external skill categories to Factory engines and defines
activation logic used by the skill resolver.

## Category mental model (extracted patterns)

| Category | Problem type | Activation stage | Cognitive role | Output type | Dependencies |
| --- | --- | --- | --- | --- | --- |
| Autonomous & Agentic | Agent coordination and autonomy control | Before + During | planner, auditor | decision, task queue | policies, memory |
| Integrations & APIs | Service connectivity and data exchange | During | executor, validator | code, config | docs, credentials |
| Cybersecurity | Threats, risks, and mitigations | Before + After | auditor, critic | risk report, checklist | architecture, threat model |
| Creative & Design | UX, content, and interface decisions | Before + During | creator, critic | design artifacts, guidelines | product goals |
| Development | Feature implementation and refactors | During | executor | code | plan approval |
| Infrastructure & Git | CI/CD, hosting, repo operations | During + After | executor, auditor | pipeline config, infra code | policies, QA evidence |
| AI Agents & LLM | Agent design and prompt systems | Before + During | creator, planner | agent configs, prompts | policy rules |
| Workflow & Planning | Scoping, research, and planning | Before | planner | plan docs, checklists | evidence sources |
| Document Processing | Extracting and transforming documents | Before + After | executor, validator | structured data | docs repository |
| Testing & QA | Validation and regression control | After | validator, auditor | reports, diagnostics | test plan |
| Product & Strategy | Trade-offs, roadmap, positioning | Before + During | decision, critic | decision records | research, metrics |
| Marketing & Growth | Distribution, release messaging | After | creator, executor | release notes, campaigns | QA summary |
| Maker Tools | Tooling and automation | Before + During | creator, executor | scripts, tooling | infra policies |

## Category to engine mapping

| Category | Factory engine |
| --- | --- |
| Workflow & Planning | planner-engine |
| Testing & QA | quality-engine |
| AI Agents & LLM | agent-orchestrator |
| Document Processing | doc-engine |
| Infrastructure & Git | execution-engine |
| Cybersecurity | security-engine |
| Product & Strategy | decision-engine |
| Marketing & Growth | distribution-engine |
| Autonomous & Agentic | agent-orchestrator + skill-resolver |
| Integrations & APIs | execution-engine |
| Development | execution-engine |
| Creative & Design | doc-engine |
| Maker Tools | execution-engine |

## Resolver rules summary

- Missing research triggers research-agent and blocks planning/execution.
- Missing plan triggers planner-agent and blocks execution.
- QA required before distribution.
- Policy violations route to decision-agent and stop.
