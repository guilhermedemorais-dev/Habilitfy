# Agentic Systems

Agents are single-purpose executors with strict contracts and permissions.
They do not share responsibilities across roles.

Agent contract files:
- agent.yaml: role, stage, triggers, inputs, outputs
- logic.md: reasoning steps and non-goals
- inputs.schema.json: validated input contract
- outputs.schema.json: validated output contract
- memory.md: allowed memory scope
- permissions.yaml: read/write boundaries

Engine alignment:
- Planner engine uses research-agent and planner-agent.
- Execution engine uses executor-agent.
- Quality engine uses qa-agent.
- Security engine uses security-agent.
- Doc engine uses doc-agent.
- Decision engine uses decision-agent.
- Distribution engine uses distribution-agent.
- Agent orchestrator uses orchestrator-agent.

Memory rules:
- Agents read and write only through factory-workflow/memory files.
- Decisions must be recorded before policy exceptions.
