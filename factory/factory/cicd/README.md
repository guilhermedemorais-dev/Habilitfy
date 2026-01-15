# CI/CD da Factory

## O que e
Modulo de governanca que define estrategia, gates, templates e deploy sem YAML executavel. Fonte de verdade: `factory/cicd/strategy.md`, `factory/cicd/gates.md`, `factory/cicd/templates.md`, `factory/cicd/checklist.md`, `factory/cicd/deploy.md`.

## Como usar
1. Ler `factory/cicd/strategy.md` para entender objetivos e estagios.
2. Aplicar gates de `factory/cicd/gates.md` no pipeline.
3. Usar `factory/cicd/templates.md` como especificacao de pipeline (sem YAML).
4. Preencher `factory/cicd/checklist.md` antes de liberar.
5. Para release/deploy, seguir `factory/cicd/deploy.md`.
5. Conectar os gates com:
   - `factory/context/quality/quality-bars.md`
   - `factory/tests/*`
   - `factory/context/tooling/mcp-policy.md` (se existir)
   - `factory/context/ui/component-policy.md` (se existir)

## O que bloqueia PR
- Gates de `factory/cicd/gates.md` nao atendidos.
- Quality bars em `factory/context/quality/quality-bars.md` nao cumpridos.
- Testes exigidos em `factory/tests/*` nao executados.
- Politicas de MCP e componentes nao seguidas quando aplicavel.

## Saidas/artefatos
- Evidencias de gates aplicados (referencia em `factory/cicd/gates.md`).
- Checklist preenchido em `factory/cicd/checklist.md`.
- Relatorios de testes conforme `factory/tests/*`.
- Registro dos templates usados em `factory/cicd/templates.md`.
- Evidencias de deploy conforme `factory/cicd/deploy.md` (quando aplicavel).
