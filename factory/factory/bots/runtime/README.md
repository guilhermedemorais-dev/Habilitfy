# Runtime

## Objective
Provide a minimal, executable runtime for Factory bots using LangChain.

## What this does
- Loads bot contracts from `factory/bots/<bot>.md`
- Loads context from `factory/context/INDEX.md` and referenced files
- Runs a task with an LLM
- Writes outputs to files (never stdout-only)
- Records gaps in `factory/context/core/gaps.md` when context is missing

## Requirements
- Python 3.10+
- API access for the configured LLM provider

## Setup
1) Create a virtual environment and install deps:
```
python -m venv .venv
. .venv/bin/activate
pip install -r factory/bots/runtime/requirements.txt
```

2) Configure env vars:
```
cp factory/bots/runtime/.env.example .env
# edit .env
```

3) Review runtime config:
- `factory/bots/runtime/config.yaml`

## Run
```
python factory/bots/runtime/cli.py run orchestrator --task "Summarize current plan" --workspace "/path/to/workspace"
```

For dev bot (requires a project path under /apps):
```
python factory/bots/runtime/cli.py run dev --task "Implement feature X" --workspace "/path/to/workspace" --project "/apps/my-project"
```

## Outputs
- Execution outputs: `factory/bots/runtime/out/<timestamp>/<bot>/`
- Deliverables:
  - Documentation/plan bots: only inside `/factory`
  - Dev bot: only inside `/apps/<project>` (required)

## Notes
- If context is missing, the bot will append gaps to `factory/context/core/gaps.md` and stop.
- Paths are validated; path traversal is blocked.
- LLM token limit can be set via `FACTORY_LLM_MAX_COMPLETION_TOKENS` or `llm.max_completion_tokens` in `factory/bots/runtime/config.yaml`.
