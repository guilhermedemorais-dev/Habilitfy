# Component Policy

## Objetivo
Definir politica obrigatoria para uso/criacao de componentes UI.

## Regra principal
Buscar em registry antes de criar.

## Ordem obrigatoria
1) Registry (ex.: `factory-workflow/libs/mcp/registries/*`)
2) Design-system interno (`factory-workflow/design-system/*`)
3) Criacao nova (ultimo recurso)

## Evidencias exigidas em PR
- Registro da busca em registry/MCP.
- Justificativa de criacao nova.
- Alinhamento com design-system.
- Registro do componente criado.

## Criterios para aceitar componente novo
- Necessidade comprovada.
- Aderencia a tokens e acessibilidade.
- Nao duplicar componente existente.

## Relacoes
- Registries: `factory-workflow/libs/mcp/registries/*`
- Design system: `factory-workflow/design-system/*`
- Gates: `factory-workflow/cicd/gates.md`
