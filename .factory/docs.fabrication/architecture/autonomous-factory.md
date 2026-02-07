# Autonomous Factory Architecture

Goal:
- Turn vague intent into a governed execution pipeline.

Core layers:
1) Skill Resolver (context analysis and routing)
2) Engines (planner, execution, quality, security, decision, doc, distribution)
3) Agents (single-purpose executors bound by contracts)
4) Policy Engine (gates and guardrails)
5) Memory (decisions, outcomes, and history)

Execution flow:
- Intent enters the orchestrator agent.
- Skill resolver detects gaps and creates a queue.
- Planner engine produces research and plan artifacts.
- Execution engine applies approved changes.
- Quality and security engines validate outputs.
- Doc engine updates documentation and architecture records.
- Distribution engine prepares release assets.
- Policy engine gates every write, release, and destructive action.

Artifacts:
- Research: factory-workflow/docs/projects/**/work/**/research.md
- Plan: factory-workflow/docs/projects/**/work/**/plan.md
- Decisions: factory-workflow/docs/projects/**/work/**/decisions.md
- QA evidence: factory-workflow/tests/reports/**

Design constraints:
- No agent can write outside its permissions.
- No implementation starts without a plan.
- No release without QA evidence.
- No destructive action without human confirmation.
