# MCP Policy

## Objetivo
Definir politica obrigatoria de uso de MCP (Model/Context/Component Providers).

## Regra principal
Reuso antes de criar. MCP/registry e primeira opcao quando aplicavel.

## Quando MCP e obrigatorio
- Mudancas em componentes UI.
- Uso de libs ou templates existentes em registry.
- Integracoes com componentes padronizados.

## Evidencias exigidas em PR
- Registro da busca em MCP/registry.
- Justificativa quando nao houver componente adequado.
- Referencia ao design-system quando aplicavel.

## Quando nao existir componente adequado
- Registrar gap em `factory/context/core/gaps.md`.
- Documentar decisao antes de criar.

## Relacoes
- Registries e servers: `factory/libs/mcp/*`
- Design system: `factory/design-system/*`
- Quality bars: `factory/context/quality/quality-bars.md`
- Gates: `factory/cicd/gates.md`
