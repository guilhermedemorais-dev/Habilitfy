# Observability

## Principios
- Visibilidade de comportamento em producao e testes.
- Dados suficientes para diagnostico.
- Sem vazamento de informacao sensivel.

## O que observar
- logs
- metricas
- eventos
- erros

## Regras minimas
- Correlacao por request/execucao quando aplicavel.
- Niveis de log consistentes.
- Nao logar dados sensiveis.

## Obrigatorio vs opcional
- Obrigatorio: logs e erros.
- Opcional (quando aplicavel): metricas e tracing.

## Relacoes
- NFRs: `factory-workflow/context/quality/nonfunctional.md`
- Security/load: `factory-workflow/tests/security.md` e `factory-workflow/tests/load.md` (se existirem)
- Gates: `factory-workflow/cicd/gates.md`
