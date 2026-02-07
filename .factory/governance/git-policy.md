# Git Policy

## Estrategia de branches
- main: protegida e auditada.
- feature/*: novas funcionalidades.
- fix/*: correcoes.
- release/*: preparacao de release.

## Politica de commits
- Padrao recomendado: Conventional Commits.
- Exemplos:
  - feat: adiciona fluxo de agendamento
  - fix: corrige validacao de horario
  - docs: atualiza contexto
  - chore: ajusta configuracao de CI

## Regras de PR
- Tamanho maximo recomendado: ate 400 linhas alteradas (excecoes justificadas).
- Checklist obrigatorio preenchido.
- Referenciar RF/RN quando aplicavel (ex.: RF-001, RNF-002).

## Regras de push
- Proibido push direto na main.
- Excecoes: emergencias autorizadas por owner; justificar no PR posterior.

## Versionamento
- Semver (MAJOR.MINOR.PATCH).
- Tags no formato vX.Y.Z.

## Relacao com qualidade e CI/CD
- Gates: `factory-workflow/cicd/gates.md`
- Checklist: `factory-workflow/cicd/checklist.md`
- DoD: `factory-workflow/context/quality/definition-of-done.md`
