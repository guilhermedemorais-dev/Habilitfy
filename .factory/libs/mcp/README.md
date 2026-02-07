# MCP

## O que e
Esta pasta define MCP (Model / Context / Component Providers) para este framework: servidores de contexto/conhecimento e registries de componentes.

## Regra central
Reuso antes de criar.

## Estrutura
- servers/: fontes de contexto, documentacao e padroes.
- registries/: catalogos de componentes reutilizaveis.

## Relacoes
- Politica MCP: `factory-workflow/context/tooling/mcp-policy.md`
- Politica de componentes: `factory-workflow/context/ui/component-policy.md`
- Design system: `factory-workflow/design-system/*`
- Gates: `factory-workflow/cicd/gates.md`

## Quando MCP e obrigatorio
- Mudanca em UI/componentes.
- Uso de componentes padronizados.
- Necessidade de documentacao confiavel antes de implementar.
