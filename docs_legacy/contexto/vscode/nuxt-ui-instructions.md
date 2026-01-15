# Instruções do Nuxt UI MCP (adaptação React)

Objetivo
Usar o Nuxt UI MCP como referência visual e de UX, traduzindo para
React + shadcn UI neste repositório, sem adicionar dependências Vue/Nuxt.

Quando usar o Nuxt UI MCP
- novas seções do admin (tabelas, filtros, dashboards, cards, estados vazios)
- padrões de interface (navegação, headers, formulários, modais, badges)
- inspiração de layout responsivo e acessível

Escopo destas instruções
- foco no painel admin e fluxos descritos no PRD
- UI consistente com tokens de `client/src/index.css`
- componentes existentes em `client/src/components/ui`

Fluxo recomendado (passo a passo)
1) Defina a seção/fluxo que será criado e os estados necessários
   - normal, loading, vazio, erro, permissão negada
2) Consulte o Nuxt UI MCP pedindo o padrão e a estrutura visual
   - solicitar variações de densidade (compacto/regular) quando necessário
3) Mapeie o padrão do Nuxt UI para shadcn UI (tabela abaixo)
4) Construa o layout em React com Tailwind usando tokens locais
5) Verifique acessibilidade (foco, labels, aria, contraste)
6) Ajuste responsividade (mobile/tablet/desktop)
7) Garanta consistência com PRD, backlog e MCPS

O que fazer
- reutilizar `client/src/components/ui` e `lucide-react`
- incluir estados de loading/empty/error em todas listas e tabelas
- usar `AuthGuard` e checagem de role para áreas admin
- manter navegação clara e alinhada ao PRD do admin

O que nao fazer
- importar pacotes Nuxt/Vue ou usar exemplos Nuxt diretamente
- adicionar dependencias novas apenas para copiar visual do Nuxt UI
- criar estilos que conflitem com `client/src/index.css`

Mapeamento rapido (Nuxt UI -> shadcn)
- UButton -> Button
- UCard -> Card + CardContent
- UTable -> Table
- UBadge -> Badge
- UInput -> Input
- USelect -> Select
- UAlert -> Alert
- UDropdown -> DropdownMenu
- UTabs -> Tabs
- UModal -> Dialog
- USheet/Drawer -> Sheet
- USkeleton -> Skeleton
- UAvatar -> Avatar
- USeparator -> Separator

Checklist de UX e acessibilidade
- foco visivel em inputs e botoes
- labels ou aria-label nos campos
- tabela com header claro e alinhamento consistente
- badges com texto legivel e contraste adequado
- estados vazios com orientacao clara (o que fazer em seguida)
- erros com mensagem objetiva + acao de retry

Padroes de estados (copiar e adaptar)
- loading: spinner + texto curto
- vazio: mensagem simples + CTA quando aplicavel
- erro: alerta com icone + retry
- sem permissao: mensagem curta e neutra

Prompts prontos para o Nuxt UI MCP
1) Dashboard admin
   "Crie um layout de dashboard admin com cards KPI, grafico simples,
   e lista de pendencias. Inclua estados vazio e loading."

2) Lista com filtros
   "Forneca um padrao de tabela admin com filtros no topo (status, data, busca),
   e acoes por linha. Inclua estado vazio e erro."

3) Fila de KYC
   "Sugira um layout de fila de aprovacao KYC com cards/tabela, preview de documentos,
   botoes aprovar/rejeitar e comentarios obrigatorios."

4) Centro de notificacoes
   "Crie uma tela de notificacoes admin com formulario de envio e historico,
   incluindo agendamento e filtros por segmento."

5) Chat admin
   "Sugira um layout de chat admin com lista lateral de conversas e painel principal,
   incluindo upload de arquivo e status online."

Como transformar resposta do MCP em React
1) Identifique blocos principais (header, filtros, tabela, sidebar)
2) Substitua componentes Nuxt por shadcn (tabela acima)
3) Aplique classes Tailwind ja usadas no projeto
4) Mantenha dados mockados apenas quando a API nao existir
5) Documente no backlog quando uma tela tiver dependencia de API

Referencias
- componentes UI: `client/src/components/ui`
- tokens e tema: `client/src/index.css`
- config MCP: `docs/contexto/vscode/mcp.json`
- PRD admin: `docs/produto/prd-admin.md`
