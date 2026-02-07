# Dependencies

## Dependencias entre modulos
- factory-workflow/context/quality depende de factory-workflow/context/core.
- factory-workflow/tests depende de factory-workflow/context/quality.
- factory-workflow/cicd depende de factory-workflow/tests e factory-workflow/context/quality.
- factory-workflow/prompts depende de factory-workflow/context/codex.
- factory-workflow/design-system depende de factory-workflow/context/ui.
- factory-workflow/libs/mcp depende de factory-workflow/context/tooling e factory-workflow/context/ui.

## Regras de ordem de trabalho
- Definir factory-workflow/context/core antes de factory-workflow/context/quality.
- Definir factory-workflow/context/quality antes de factory-workflow/tests.
- Definir factory-workflow/tests antes de factory-workflow/cicd.

## Se mudar X, revisar Y
- Se mudar factory-workflow/context/core, revisar factory-workflow/context/quality.
- Se mudar factory-workflow/context/quality, revisar factory-workflow/tests e factory-workflow/cicd.
- Se mudar factory-workflow/context/ui, revisar factory-workflow/design-system e factory-workflow/libs/mcp/registries.
- Se mudar factory-workflow/cicd/gates, revisar checklists.
