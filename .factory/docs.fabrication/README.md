# Factory Docs

## Objetivo
Esta pasta contém a documentação de uso do framework, com guias, templates oficiais e exemplos preenchidos.

## Onde começar
- Guia rápido: `factory-workflow/docs/quickstart.md`
- Workflow completo (RPI): `factory-workflow/docs/workflow.md`
- Glossário (reduz ambiguidade): `factory-workflow/docs/glossary.md`

## Templates e exemplos
- Templates oficiais: `factory-workflow/docs/templates/README.md`
- Template de plan: `factory-workflow/docs/templates/plan.template.md`
- Exemplos preenchidos: `factory-workflow/docs/examples/README.md`
- Exemplo completo de feature (RPI): `factory-workflow/docs/examples/work-feature.example/`

## Relação entre docs.md e context/*
- `docs.md` é um documento mestre humano.
- O conteúdo do `docs.md` deve ser distribuído para os arquivos operacionais em `factory-workflow/context/*`.
- Bots operam sempre sobre `factory-workflow/context/*` (fontes de verdade), não sobre o `docs.md`.

## Convenções e regras
- Não inventar requisitos.
- Se faltar decisão/informação, registrar em `factory-workflow/context/core/gaps.md`.
- Templates são canônicos e devem ser reutilizados.
