# Implementation Rules (Codex / Bot-Dev)

## Objetivo
Definir o processo obrigatorio de implementacao para o Codex/bot-dev.

## Processo obrigatorio
1. Ler `factory/context/INDEX.md`.
2. Validar escopo com base no contexto.
3. Se faltar informacao: registrar em `factory/context/core/gaps.md` e parar.
4. Reuso obrigatorio via MCP/registry/design-system.
   - `factory/context/tooling/mcp-policy.md` (se existir)
   - `factory/context/ui/component-policy.md` (se existir)
   - `factory/design-system/*` (se existir)
5. Implementar e atualizar testes conforme `factory/tests/*`.
6. Cumprir gates de `factory/cicd/gates.md`.

## Proibicoes (hard)
- Inventar requisitos.
- Alterar contexto para "passar".
- Escrever fora do workspace permitido.

## Evidencias obrigatorias em PR
- Referencias aos arquivos de contexto usados.
- Evidencia de busca em MCP/registry quando aplicavel.
- Resultados de testes exigidos por `factory/tests/*`.
- Conformidade com `factory/cicd/gates.md`.
