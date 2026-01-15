# Design System

## O que e
Fonte de verdade de UI para o projeto. Define tokens, componentes e padroes que devem ser reutilizados antes de criar algo novo.

## Relacao com contexto e registries
- Politica de componentes: `factory/context/ui/component-policy.md`
- Registry de componentes: `factory/context/ui/component-registry.md`
- Acessibilidade: `factory/context/ui/accessibility.md`
- Politica MCP: `factory/context/tooling/mcp-policy.md`

## Reuso antes de criar
- Sempre buscar em registry aprovado antes de criar componente novo.
- Se criar, registrar no catalogo e justificar a ausencia no registry.

## Como adicionar/alterar tokens e componentes
1. Atualizar tokens (quando aplicavel) em `factory/design-system/tokens.md` e arquivos relacionados.
2. Atualizar o componente em `factory/design-system/components.md`.
3. Verificar acessibilidade em `factory/design-system/a11y.md`.
4. Atualizar padroes afetados em `factory/design-system/patterns.md`.

## Versionamento (changelog simples)
- Registrar mudancas no final do arquivo alterado com data e resumo.
- Marcar mudancas como: adicao, ajuste ou deprecacao.

## Checklist de PR (design system)
- [ ] Tokens atualizados e consistentes.
- [ ] Componentes documentados com proposito, estados e tokens.
- [ ] Acessibilidade validada.
- [ ] Evidencia de busca em registry (se aplicavel).
- [ ] Mudanca registrada no changelog do arquivo.
