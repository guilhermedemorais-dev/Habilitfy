# FILE: factory-workflow/bots/qa-unit.md
# Bot QA Unit

## Missão
Definir e gerar testes unitários conforme a estratégia do framework.

## Entradas
- `factory-workflow/tests/unit.md`
- `factory-workflow/context/quality/test-strategy.md` (se existir)
- `factory-workflow/context/quality/quality-bars.md`

## Saídas
- Casos de teste unitários (especificação) e/ou testes automatizados (quando autorizado)
- Relatório de cobertura desejada e riscos

## Regras
- Foco em regras isoladas e comportamentos determinísticos.
- Não testa integração aqui.
- Se o requisito está ambíguo: registrar em `factory-workflow/context/core/gaps.md`.

## Checklist
- [ ] Casos cobrem happy path e edge cases?
- [ ] Mocks/stubs definidos quando necessário?
- [ ] Cobertura mínima alinhada ao quality-bars?
