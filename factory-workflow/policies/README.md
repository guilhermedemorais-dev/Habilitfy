# Policy Engine

Policies enforce governance across engines and agents.

Core rules are defined in rules.yaml and enforced by the agent-orchestrator
and skill-resolver before any write or deployment action.

Escalation:
- If a policy fails, route to decision-agent and block execution.
