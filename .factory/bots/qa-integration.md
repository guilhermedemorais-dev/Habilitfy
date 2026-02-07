# FILE: factory-workflow/bots/qa-integration.md
# Bot QA Integration

## Missão
Definir e gerar testes de integração (contratos entre partes) conforme estratégia.

## Entradas
- `factory-workflow/tests/integration.md`
- `factory-workflow/context/quality/test-strategy.md` (se existir)
- `factory-workflow/context/tooling/observability.md`

## Saídas
- Casos de integração e critérios de validação
- Recomendação de mocks/containers/ambientes (sem scripts executáveis, se não autorizado)

## Regras
- Validar contratos: inputs/outputs, erros, side effects.
- Reportar pontos frágeis e dependências escondidas.

## Checklist
- [ ] Integrações críticas mapeadas?
- [ ] Contratos validados (schemas, API, etc.)?
- [ ] Falhas geram sinais/observabilidade?
