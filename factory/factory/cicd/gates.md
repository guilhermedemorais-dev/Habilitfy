# CI/CD Gates

## Objetivo
Definir requisitos de gate (nao executaveis) para pipelines.

## Fontes de verdade
- factory/context/quality/quality-bars.md
- factory/context/quality/test-strategy.md
- factory/context/tooling/mcp-policy.md
- factory/context/tooling/runtime.md
- factory/context/ui/component-policy.md
- factory/context/codex/implementation-rules.md
- factory/docs/workflow.md
- factory/cicd/deploy.md
- factory/governance/git-policy.md

## Gates
1) **Context compliance**
   - Ordem de leitura valida (`factory/context/INDEX.md`).
   - Sem gaps bloqueantes em `factory/context/core/gaps.md`.
2) **Reuse + design**
   - Reuso MCP/registry verificado.
   - Design system alinhado (quando aplicavel).
3) **Qualidade e testes**
   - Quality bars atendidas.
   - Testes executados conforme estrategia.
   - Projetos com UI navegavel rodam `qa-e2e-browser-audit` com relatorio e evidencias.
4) **Documentacao e evidencias**
   - Research/Plan atualizados com links e evidencias.
   - Decision records quando aplicavel.
5) **Seguranca e risco**
   - Auditoria de dependencias obrigatoria quando deps mudarem.
   - Checks de seguranca conforme `factory/tests/security.md`.
6) **Release readiness**
   - Versionamento e tags conforme `factory/governance/git-policy.md`.
   - Changelog atualizado quando houver release.
7) **Controle de deploy**
   - Staging validado.
   - **Producao exige aprovacao humana**.

## Checklist (resumo)
- [ ] Context compliance verificado.
- [ ] Reuso verificado.
- [ ] Testes completos.
- [ ] Browser audit executado quando houver UI navegavel.
- [ ] Docs/evidencias atualizadas.
- [ ] Seguranca auditada.
- [ ] Release readiness confirmada.
- [ ] Aprovacao humana registrada para producao.

## Como usar
Mapear cada gate para um estagio em `factory/cicd/templates.md`.
