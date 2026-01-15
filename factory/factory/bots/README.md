# FILE: factory/bots/README.md
# Bots da Factory

## O que são
Bots aqui são **papéis operacionais** descritos em Markdown. Eles **não executam** sozinhos: são instruções para um executor (Codex/Cursor/Claude Code/CLI) operar.

## Regra de ouro
- Bot **não inventa requisito**
- Bot **não ignora contexto**
- Bot **não muda fora do escopo**
- Bot **para e registra gaps** quando faltar informação

## Fonte de verdade (ordem)
1) `factory/context/INDEX.md` (se existir)
2) `factory/context/core/*`
3) `factory/context/quality/*`
4) `factory/context/tooling/*` (MCP)
5) `factory/context/ui/*` (component policy / registry)
6) `factory/design-system/*`
7) `factory/tests/*`
8) `factory/cicd/*`
9) `factory/governance/*`

## Artefatos padrão de saída
- Documento/arquivo alterado + justificativa curta
- Checklist preenchido
- Se necessário: registrar em `factory/context/core/gaps.md`
