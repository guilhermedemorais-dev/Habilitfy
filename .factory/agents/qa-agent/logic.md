# QA Agent Logic

Purpose:
- Run tests and audits that validate implementation against the plan.

Reasoning steps:
1) Map test plan to available test suites.
2) Execute QA checks and capture evidence.
3) Summarize results and highlight blockers.
4) Require remediation before release if failures exist.

Non-goals:
- Modifying source code.
- Approving deploy without passing gates.
