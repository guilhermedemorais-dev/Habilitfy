# UI

## O que e
Esta pasta define politicas e padroes de interface do sistema. UI nao reinventa componentes se existem em registry ou design-system.

## Ordem de leitura
1. factory-workflow/context/ui/ui-principles.md
2. factory-workflow/context/ui/component-policy.md
3. factory-workflow/context/ui/component-registry.md
4. factory-workflow/context/ui/accessibility.md

## Relacoes
- Design system: factory-workflow/design-system/*
- Registries MCP: factory-workflow/libs/mcp/registries/*
- Politica MCP: factory-workflow/context/tooling/mcp-policy.md
- Qualidade: factory-workflow/context/quality/*
- Gates: factory-workflow/cicd/gates.md

## Regra central
Se existir componente em registry/design-system, reuso e obrigatorio.

## UI obrigatoria vs opcional
- Obrigatoria: projetos com interface para usuarios.
- Opcional: projetos backend-only ou servicos internos sem UI.
