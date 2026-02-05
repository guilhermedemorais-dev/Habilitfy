# CI/CD da Factory

## O que e
Modulo de governanca que define estrategia, gates, templates e deploy sem YAML executavel. Fonte de verdade: `factory-workflow/cicd/strategy.md`, `factory-workflow/cicd/gates.md`, `factory-workflow/cicd/templates.md`, `factory-workflow/cicd/checklist.md`, `factory-workflow/cicd/deploy.md`.

## Como usar
1. Ler `factory-workflow/cicd/strategy.md` para entender objetivos e estagios.
2. Aplicar gates de `factory-workflow/cicd/gates.md` no pipeline.
3. Usar `factory-workflow/cicd/templates.md` como especificacao de pipeline (sem YAML).
4. Preencher `factory-workflow/cicd/checklist.md` antes de liberar.
5. Para release/deploy, seguir `factory-workflow/cicd/deploy.md`.
5. Conectar os gates com:
   - `factory-workflow/context/quality/quality-bars.md`
   - `factory-workflow/tests/*`
   - `factory-workflow/context/tooling/mcp-policy.md` (se existir)
   - `factory-workflow/context/ui/component-policy.md` (se existir)

## O que bloqueia PR
- Gates de `factory-workflow/cicd/gates.md` nao atendidos.
- Quality bars em `factory-workflow/context/quality/quality-bars.md` nao cumpridos.
- Testes exigidos em `factory-workflow/tests/*` nao executados.
- Politicas de MCP e componentes nao seguidas quando aplicavel.

## Saidas/artefatos
- Evidencias de gates aplicados (referencia em `factory-workflow/cicd/gates.md`).
- Checklist preenchido em `factory-workflow/cicd/checklist.md`.
- Relatorios de testes conforme `factory-workflow/tests/*`.
- Registro dos templates usados em `factory-workflow/cicd/templates.md`.
- Evidencias de deploy conforme `factory-workflow/cicd/deploy.md` (quando aplicavel).
