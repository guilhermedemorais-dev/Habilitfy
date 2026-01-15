# UI

## O que e
Esta pasta define politicas e padroes de interface do sistema. UI nao reinventa componentes se existem em registry ou design-system.

## Ordem de leitura
1. factory/context/ui/ui-principles.md
2. factory/context/ui/component-policy.md
3. factory/context/ui/component-registry.md
4. factory/context/ui/accessibility.md

## Relacoes
- Design system: factory/design-system/*
- Registries MCP: factory/libs/mcp/registries/*
- Politica MCP: factory/context/tooling/mcp-policy.md
- Qualidade: factory/context/quality/*
- Gates: factory/cicd/gates.md

## Regra central
Se existir componente em registry/design-system, reuso e obrigatorio.

## UI obrigatoria vs opcional
- Obrigatoria: projetos com interface para usuarios.
- Opcional: projetos backend-only ou servicos internos sem UI.
