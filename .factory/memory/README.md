# Memory

Memory stores decisions and execution history to improve autonomy.

Stores:
- short_term.yaml: recent tasks, active contexts, open gaps
- decisions.md: human-approved decisions and rationale
- index.json: machine index for search and retrieval

Rules:
- Never store secrets or credentials.
- Only store approved decisions and outcomes.
- Link memory entries to project work items.
