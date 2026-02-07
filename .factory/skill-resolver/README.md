# Skill Resolver

Purpose:
- Analyze current context and route work to engines and agents.
- Detect gaps in Research, Plan, Tests, Docs, and Decisions.

Core responsibilities:
- Parse factory-workflow/context and project work files.
- Identify missing artifacts (research.md, plan.md, tests, decisions).
- Select engines and agents based on category fit and risk.
- Resolve dependencies and produce an ordered queue.

Inputs:
- Context snapshot from factory-workflow/context/**
- Project artifacts from factory-workflow/docs/projects/**/work/**
- Agent registry from factory-workflow/agents/registry.yaml
- Policy rules from factory-workflow/policies/rules.yaml

Outputs:
- Execution queue in queue.yaml
- Dependency graph and routing decisions in resolver.yaml

Failure rules:
- If a critical gap exists, emit a blocking task for research/planning.
- If a policy gate fails, emit a decision task and stop.
