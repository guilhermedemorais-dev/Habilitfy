# CI/CD Gates

## Objective
Define non-executable gate requirements for pipelines.

## Sources of truth
- factory/context/quality/quality-bars.md
- factory/context/quality/test-strategy.md
- factory/context/tooling/mcp-policy.md
- factory/context/ui/component-policy.md
- factory/context/codex/implementation-rules.md
- factory/cicd/deploy.md
- factory/governance/git-policy.md

## Gates
1. Context compliance
   - Context read order validated (`factory/context/INDEX.md`)
   - No unresolved gaps (`factory/context/core/gaps.md`)
2. Reuse and design compliance
   - MCP/registry reuse verified
   - Design system alignment verified
3. Quality and testing
   - Quality bars met
   - Tests executed per strategy
4. Documentation
   - Context and decision records updated
5. Security and risk (when applicable)
   - Security checks per `factory/tests/security.md`
6. Release readiness
   - Versioning follows semver and tag policy (`factory/governance/git-policy.md`)
   - Changelog present for release
7. Production deploy control
   - Production deploy requires human approval (manual gate)
   - Pre-deploy checklist completed (`factory/cicd/deploy.md`)

## Checklist
- [ ] Context compliance verified.
- [ ] Reuse verified.
- [ ] Tests complete.
- [ ] Docs updated.
- [ ] Risk checks completed.
- [ ] Release readiness confirmed.
- [ ] Production approval recorded.

## How to use
- Map each gate to a pipeline stage in `factory/cicd/templates.md`.
