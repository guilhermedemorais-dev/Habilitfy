# Dependencies

## Dependencias entre modulos
- factory/context/quality depende de factory/context/core.
- factory/tests depende de factory/context/quality.
- factory/cicd depende de factory/tests e factory/context/quality.
- factory/prompts depende de factory/context/codex.
- factory/design-system depende de factory/context/ui.
- factory/libs/mcp depende de factory/context/tooling e factory/context/ui.

## Regras de ordem de trabalho
- Definir factory/context/core antes de factory/context/quality.
- Definir factory/context/quality antes de factory/tests.
- Definir factory/tests antes de factory/cicd.

## Se mudar X, revisar Y
- Se mudar factory/context/core, revisar factory/context/quality.
- Se mudar factory/context/quality, revisar factory/tests e factory/cicd.
- Se mudar factory/context/ui, revisar factory/design-system e factory/libs/mcp/registries.
- Se mudar factory/cicd/gates, revisar checklists.
