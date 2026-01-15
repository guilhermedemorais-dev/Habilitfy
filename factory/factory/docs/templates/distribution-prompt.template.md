# Distribution Prompt Template

## Objetivo
Distribuir o conteudo de docs.md para os arquivos do framework.

## Prompt (copie e preencha)

Voce e o Codex. Pegue o arquivo `factory/docs/projects/<NOME_PROJETO>/docs.md` e distribua o conteudo para os arquivos abaixo. Regras: substituir 100% do conteudo, nao escrever codigo de produto, registrar gaps em `factory/context/core/gaps.md` quando faltar informacao.

Mapeamento:
- Visao -> `factory/context/core/vision.md`
- Escopo -> `factory/context/core/scope.md`
- Requisitos -> `factory/context/core/requirements.md`
- Regras de negocio -> `factory/context/core/business-rules.md`
- Dados -> `factory/context/core/data.md`
- Glossario -> `factory/context/core/glossary.md`
- Principios -> `factory/context/core/principles.md`
- Guardrails -> `factory/context/core/guardrails.md`
- Quality -> `factory/context/quality/*`
- Tooling -> `factory/context/tooling/*`
- UI -> `factory/context/ui/*`
- Design system -> `factory/design-system/*`
- Testes -> `factory/tests/*`
- CI/CD -> `factory/cicd/*`
- Governance -> `factory/governance/*`
- Plan -> `factory/plan/*`
- Prompts -> `factory/prompts/*` (se houver mudanca)
- MCP -> `factory/libs/mcp/*`

Saida esperada: escrita direta nos arquivos, sem explicacoes fora deles.
