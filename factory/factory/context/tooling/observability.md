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
- NFRs: `factory/context/quality/nonfunctional.md`
- Security/load: `factory/tests/security.md` e `factory/tests/load.md` (se existirem)
- Gates: `factory/cicd/gates.md`
