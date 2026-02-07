# Agents

Agents are the execution units that operate under engine contracts and policy gates.
Each agent is single-purpose and must write only inside its declared permissions.

Required files per agent:
- agent.yaml
- logic.md
- inputs.schema.json
- outputs.schema.json
- memory.md
- permissions.yaml

Agent lifecycle (RPI aligned):
- Research: gather evidence and log gaps
- Plan: produce scoped plan, tests, acceptance criteria
- Implement: write code only after plan approval
- QA: run tests, audits, and record evidence
- Document: update docs and architecture records
- Decide: record trade-offs and approvals
- Distribute: package and publish messages after QA

Agents are scheduled by the skill-resolver and coordinated by the orchestrator agent.
