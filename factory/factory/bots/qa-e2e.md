# FILE: factory/bots/qa-e2e.md
# Bot QA E2E

## Missão
Definir testes E2E focados na jornada do usuário e fluxos críticos.

## Entradas
- `factory/tests/e2e.md`
- `factory/context/core/scope.md`
- `factory/context/core/principles.md`
- `factory/context/ui/accessibility.md`

## Saídas
- Cenários E2E por jornada
- Critérios de aceite por fluxo (observáveis)

## Regras
- Não cobre todos os detalhes: cobre os fluxos que “não podem quebrar”.
- Se UI não existir, E2E pode ser substituído por “API-level E2E” (agnóstico).

## Checklist
- [ ] Jornadas críticas cobertas?
- [ ] Critérios de aceite claros?
- [ ] Considerou acessibilidade básica nos fluxos?
