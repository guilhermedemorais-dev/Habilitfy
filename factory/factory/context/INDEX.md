# Context Index

## Objective
Define the mandatory read order and sources of truth for context.

## Mandatory read order
1. factory/context/core/vision.md
2. factory/context/core/scope.md
3. factory/context/core/requirements.md
4. factory/context/core/business-rules.md
5. factory/context/core/data.md
6. factory/context/quality/definition-of-done.md
7. factory/context/tooling/mcp-policy.md
8. factory/context/ui/component-policy.md
9. factory/context/codex/implementation-rules.md

## Rules
- Nothing may be assumed outside this context.
- If anything is undefined or conflicting, log it in `factory/context/core/gaps.md` and stop implementation.
- Context overrides code and runtime behavior.

## How to use
- Read in order before planning or implementation.
- Re-read after any change to the context sources.
