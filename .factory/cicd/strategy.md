# Estrategia de CI/CD

## Objetivo
Definir uma estrategia agnostica de stack para garantir qualidade, repetibilidade e feedback rapido, seguindo os gates em `factory-workflow/cicd/gates.md`.

## Principios
- stop-the-line: falhas criticas bloqueiam merge
- feedback rapido: etapas curtas primeiro
- repetibilidade: execucoes deterministicas
- rastreabilidade: evidencias e logs em todos os estagios

## Estagios padrao
1. lint/format: aplica padrao de estilo e consistencia
2. typecheck: valida contratos e tipos quando aplicavel
3. unit: valida comportamento isolado
4. integration: valida integracoes e fluxos entre modulos
5. e2e: valida fluxos ponta a ponta quando aplicavel
6. security: executa verificacoes de seguranca
7. load (opcional): valida performance e carga quando aplicavel
8. build/package: gera artefatos versionados
9. deploy (opcional): publica em ambiente alvo quando habilitado

## Quando rodar
- push: lint/format, typecheck, unit
- PR: lint/format, typecheck, unit, integration, security
- merge: conjunto completo exigido por `factory-workflow/cicd/gates.md`
- tag/release: pipeline completo + build/package + deploy (se aplicavel)
- deploy deve seguir `factory-workflow/cicd/deploy.md`

## Artefatos esperados
- relatorios de lint/format e typecheck
- resultados de testes (unit/integration/e2e)
- cobertura de testes quando aplicavel
- resultados de security
- logs de execucao
- artefatos de build/package
- evidencias de deploy quando aplicavel

## Politica de falhas
- HARD FAIL: bloqueia merge, conforme `factory-workflow/cicd/gates.md`
- SOFT FAIL: alerta e exige acao, mas nao bloqueia merge, conforme `factory-workflow/cicd/gates.md`

## Relacao com DoD, quality-bars e testes
- DoD deve ser atendido antes de liberar: `factory-workflow/context/quality/definition-of-done.md`
- Quality bars definem criterios minimos: `factory-workflow/context/quality/quality-bars.md` (se existir)
- Estrategia de testes esta em `factory-workflow/tests/README.md` (se existir) e `factory-workflow/tests/*`
- Gates traduzem esses requisitos em bloqueios: `factory-workflow/cicd/gates.md`
- Releases e deploys devem seguir `factory-workflow/cicd/deploy.md`

## Referencias
- `factory-workflow/cicd/gates.md`
- `factory-workflow/context/quality/quality-bars.md` (se existir)
- `factory-workflow/tests/README.md` (se existir) ou `factory-workflow/tests/*`
