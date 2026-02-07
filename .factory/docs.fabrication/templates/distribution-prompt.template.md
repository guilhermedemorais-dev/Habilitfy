# Distribution Prompt Template

## Objetivo
Distribuir o conteudo de docs.md para os arquivos do framework.

## Prompt (copie e preencha)

Voce e o Codex. Pegue o arquivo `factory-workflow/docs/projects/<NOME_PROJETO>/docs.md` e distribua o conteudo para os arquivos abaixo. Regras: substituir 100% do conteudo, nao escrever codigo de produto, registrar gaps em `factory-workflow/context/core/gaps.md` quando faltar informacao.

Mapeamento:
- Visao -> `factory-workflow/context/core/vision.md`
- Escopo -> `factory-workflow/context/core/scope.md`
- Requisitos -> `factory-workflow/context/core/requirements.md`
- Regras de negocio -> `factory-workflow/context/core/business-rules.md`
- Dados -> `factory-workflow/context/core/data.md`
- Glossario -> `factory-workflow/context/core/glossary.md`
- Principios -> `factory-workflow/context/core/principles.md`
- Guardrails -> `factory-workflow/context/core/guardrails.md`
- Quality -> `factory-workflow/context/quality/*`
- Tooling -> `factory-workflow/context/tooling/*`
- UI -> `factory-workflow/context/ui/*`
- Design system -> `factory-workflow/design-system/*`
- Testes -> `factory-workflow/tests/*`
- CI/CD -> `factory-workflow/cicd/*`
- Governance -> `factory-workflow/governance/*`
- Plan -> `factory-workflow/plan/*`
- Prompts -> `factory-workflow/prompts/*` (se houver mudanca)
- MCP -> `factory-workflow/libs/mcp/*`

Saida esperada: escrita direta nos arquivos, sem explicacoes fora deles.
