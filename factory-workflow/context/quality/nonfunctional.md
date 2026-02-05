# Nonfunctional Requirements

## Objetivo
Definir requisitos nao funcionais padrao, agnosticos de stack.

## Seguranca (obrigatorio)
- Segredos nunca em codigo; usar CI secrets.
- Validacoes basicas OWASP onde aplicavel.
- Dependencias verificadas e justificadas.

## Confiabilidade (obrigatorio)
- Tratamento de erros consistente.
- Retries e idempotencia quando fizer sentido.
- Degradacao controlada em falhas.

## Performance (opcional por projeto)
- Metas gerais definidas no contexto.
- Medicao por testes de carga quando aplicavel.

## Observabilidade (obrigatorio)
- Logs suficientes para diagnostico.
- Metricas e tracing quando aplicavel.

## Manutenibilidade (obrigatorio)
- Estrutura modular.
- Documentacao minima atualizada.
- Padroes consistentes e rastreaveis.

## Obrigatorio vs opcional
- Obrigatorio: seguranca, confiabilidade, observabilidade, manutenibilidade.
- Opcional (quando aplicavel): performance e carga.

## Referencias
- `factory-workflow/tests/security.md` (se existir)
- `factory-workflow/tests/load.md` (se existir)
- Enforcement em `factory-workflow/cicd/gates.md`
