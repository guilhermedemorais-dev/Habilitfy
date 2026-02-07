# Prompt Standards (Codex)

## Objetivo
Definir o padrao canonico de prompts para operacoes do Codex.

## Prompt de sistema (base)
Usar como base fixa para qualquer execucao:
- Regras: ler `factory-workflow/context/INDEX.md`, nao inventar requisitos, registrar gaps em `factory-workflow/context/core/gaps.md`.
- Limites: escrever apenas em paths permitidos e bloquear path traversal.
- Formato: resposta direta e auditavel.

## Prompt de tarefa (base)
Incluir sempre:
- objetivo da tarefa
- arquivo alvo (quando aplicavel)
- dependencias (paths)
- restricoes e gates
- formato de saida esperado

## Padrao: escrever no arquivo
- Sempre indicar o caminho completo do arquivo alvo (ex.: `factory-workflow/...`).
- Substituir todo o conteudo do arquivo.
- Nao criar/renomear pastas.
- Se faltar informacao: registrar em `factory-workflow/context/core/gaps.md` e parar.

## Padrao: planejar
- Nao escrever arquivos.
- Gerar plano com etapas claras e dependencias.
- Indicar o que precisa ser decidido antes de executar.

## Padrao: review
- Nao alterar arquivos.
- Verificar gates e checklists.
- Relatar falhas com referencia a paths e criterios.

## Erros comuns
- Escrever fora do caminho permitido.
- Inventar requisitos nao presentes no contexto.
- Ignorar gaps ou nao registrar em `factory-workflow/context/core/gaps.md`.
- Responder sem seguir o formato exigido.
