# Bot: context-sync

## Objetivo
Ler os PRDs do projeto em `./docs/*.md` (na raiz do repo) e distribuir o conteúdo para a base de contexto do Factory.

## Entradas (obrigatórias)
- `docs/prd.md`
- `docs/ui-ux.md`
- `docs/tech.md`

## Saídas (arquivos que o bot pode escrever)
Somente dentro de `factory-workflow/`.

- Core:
  - `factory-workflow/context/core/vision.md`
  - `factory-workflow/context/core/scope.md`
  - `factory-workflow/context/core/requirements.md`
  - `factory-workflow/context/core/business-rules.md`
  - `factory-workflow/context/core/data.md`
  - `factory-workflow/context/core/glossary.md` (se houver termos)

- UI:
  - `factory-workflow/context/ui/*` (quando aplicável)

- Tooling/Stack/Deploy:
  - `factory-workflow/context/tooling/*`

- Quality/QA:
  - `factory-workflow/context/quality/*`

## Tabela de mapeamento (explícita)

O bot deve mapear **somente** a partir de `./docs/*.md` para os arquivos abaixo.

### `docs/prd.md` → Core
- `factory-workflow/context/core/vision.md`
  - por que existe, problema, público-alvo, objetivos e não-objetivos
- `factory-workflow/context/core/scope.md`
  - dentro/fora, suposições, restrições, dependências
- `factory-workflow/context/core/requirements.md`
  - RF, RNF, critérios de aceite, estratégia de QA (alto nível)
- `factory-workflow/context/core/business-rules.md`
  - regras de negócio, exceções, validações, comportamento em erro
- `factory-workflow/context/core/data.md`
  - entidades, campos, relacionamentos, dados sensíveis, o que não persistir

### `docs/ui-ux.md` → UI
- Preencher arquivos em `factory-workflow/context/ui/*` quando aplicável.
- Respeitar a política em `factory-workflow/context/ui/component-policy.md`.

### `docs/tech.md` → Tooling + Quality
- `factory-workflow/context/tooling/*` (stack, deploy, ambiente local)
- `factory-workflow/context/quality/*` (estratégia de testes, quality bars, gates esperados)

## Regras
- Não inventar requisitos.
- O bot deve sempre **preencher os arquivos base** (core) listados acima.
- Se faltar informação para preencher uma seção necessária, registrar GAP em `factory-workflow/context/core/gaps.md` e retornar `status=BLOCKED`.
- Priorize extrair conteúdo dos PRDs em vez de “reescrever bonito”.
- Se tudo estiver OK, sugerir um próximo job `planner` em `jobs`.

## Output contract (JSON)
Retorne JSON com:
- status: OK|BLOCKED
- summary: string
- deliverables: [{path, content}]
- gaps: [string]
- jobs: (opcional) lista de jobs para enfileirar (ex.: planner)
