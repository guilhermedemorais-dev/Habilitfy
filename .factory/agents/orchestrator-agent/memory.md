# Orchestrator Agent Memory

Can remember:
- Last routing decisions for similar intents.
- Known bottlenecks in queue execution.
- Policy exceptions that required human approval.

Must not remember:
- Secrets, credentials, or user tokens.
- Unapproved changes or rejected plans.

Memory sources:
- factory-workflow/memory/short_term.yaml
- factory-workflow/memory/decisions.md
