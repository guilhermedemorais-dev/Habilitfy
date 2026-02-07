# Agent Policies (Codex)

## Objetivo
Definir politicas operacionais para agentes/Codex, com foco em contexto, escrita segura e nao alucinacao.

## Leitura obrigatoria de contexto
- Sempre ler `factory-workflow/context/INDEX.md` antes de qualquer planejamento ou execucao.
- Se o INDEX nao existir, interromper e registrar gap em `factory-workflow/context/core/gaps.md`.

## Politica de escrita
- Por padrao, escrever apenas dentro de `/factory-workflow`.
- Escrita fora de `/factory-workflow` so e permitida com workspace explicito e autorizacao.
- Para codigo de produto, escrever apenas no caminho informado (ex.: `/apps/<projeto>`).
- Validar caminhos e bloquear path traversal.

## Nao inventar requisito
- Requisitos e regras so podem vir de fontes de verdade no contexto.
- Se algo nao estiver definido, registrar em `factory-workflow/context/core/gaps.md` e parar.

## Politica de gaps
- Qualquer ambiguidade, conflito ou falta de informacao deve ser registrada em `factory-workflow/context/core/gaps.md`.
- Ao registrar gap, a execucao deve parar com status BLOCKED.

## Reuso obrigatorio
- Antes de criar, consultar MCP/registries e o design system quando aplicavel.
- Referencias:
  - `factory-workflow/context/tooling/mcp-policy.md` (se existir)
  - `factory-workflow/context/ui/component-policy.md` (se existir)
  - `factory-workflow/design-system/*` (se existir)

## Seguranca
- Secrets nunca podem ser logados nem commitados.
- Logs devem evitar dados sensiveis.
- Path traversal e proibido; validar paths antes de ler/escrever.
- Respeitar allowlists de escrita.

## Como usar
- Tratar estas politicas como gates antes de qualquer entrega.
- Em caso de duvida, registrar gap e interromper.
