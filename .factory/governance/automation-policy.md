# Automation Policy (execucao local e CI)

## Objetivo
Definir regras de automacao segura para execucao de bots e tarefas locais/CI.

## Politica de execucao local
- Nao executar acoes destrutivas sem aprovacao humana explicita.
- Whitelist de bots permitidos e permissao por bot.
- Workspace permitido deve ser explicitado no job request.

## Human-in-the-loop
- Producao **exige** aprovacao humana (alinhado a `factory-workflow/cicd/deploy.md`).
- Aprovar Plan antes de Implement (workflow RPI).

## Auditoria e rastreabilidade
- Toda execucao deve gerar logs e outputs em disco.
- Cada job request deve ter **id** e **timestamp** (conceitual).
- Evidencias devem ser registradas em `research.md`/`plan.md`.

## Relacoes
- Politica de git: `factory-workflow/governance/git-policy.md`
- Gates de CI/CD: `factory-workflow/cicd/gates.md`
- Runtime local: `factory-workflow/context/tooling/runtime.md`
