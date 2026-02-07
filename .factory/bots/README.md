# FILE: factory-workflow/bots/README.md
# Bots da Factory

## O que são
Bots aqui são **papéis operacionais** descritos em Markdown. Eles **não executam** sozinhos: são instruções para um executor (Codex/Cursor/Claude Code/CLI) operar.

## Regra de ouro
- Bot **não inventa requisito**
- Bot **não ignora contexto**
- Bot **não muda fora do escopo**
- Bot **para e registra gaps** quando faltar informação

## Fonte de verdade (ordem)
1) `factory-workflow/context/INDEX.md` (se existir)
2) `factory-workflow/context/core/*`
3) `factory-workflow/context/quality/*`
4) `factory-workflow/context/tooling/*` (MCP)
5) `factory-workflow/context/ui/*` (component policy / registry)
6) `factory-workflow/design-system/*`
7) `factory-workflow/tests/*`
8) `factory-workflow/cicd/*`
9) `factory-workflow/governance/*`

## Artefatos padrão de saída
- Documento/arquivo alterado + justificativa curta
- Checklist preenchido
- Se necessário: registrar em `factory-workflow/context/core/gaps.md`
