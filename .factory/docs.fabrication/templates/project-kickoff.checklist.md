# Project Kickoff Checklist (Completo)

Use este checklist para iniciar um projeto do zero com base completa.
Preencha tudo antes de pedir implementacao.

## 1) Identidade do projeto
- Nome do projeto:
- Objetivo do produto:
- Publico-alvo:
- Proposta de valor:
- Metricas de sucesso:

## 2) Escopo funcional
- Modulos principais:
- Paginas por modulo:
- Fluxos criticos:
- Regras de negocio por modulo:
- Permissoes e papeis:

## 3) Documentacao de referencia (obrigatoria)
- `docs/projects/<projeto>/reference/modules/<modulo>/overview.md`
- `docs/projects/<projeto>/reference/modules/<modulo>/pages/<pagina>.md`
- `docs/projects/<projeto>/reference/modules/<modulo>/rules.md`
- `docs/projects/<projeto>/reference/modules/<modulo>/flows.md`
- `docs/projects/<projeto>/reference/modules/<modulo>/data-contracts.md`

## 4) Dados e contratos
- Entidades principais e relacionamentos:
- Esquema de dados (tabelas/colecoes):
- Contratos de API:
- Eventos e mensagens:

## 5) Integracoes externas
- Sistemas terceiros:
- Propositos de cada integracao:
- Contratos e limites:
- Webhooks e callbacks:

## 6) Stack e arquitetura
- Frontend:
- Backend:
- Banco de dados:
- Infra/Cloud:
- CI/CD:
- Observabilidade:

## 7) NFR (requisitos nao funcionais)
- Performance:
- Disponibilidade:
- Escalabilidade:
- Segurança:
- Privacidade/Compliance:
- Acessibilidade:

## 8) Design system
- Tipografia, cores, grids:
- Componentes base:
- Tokens e variantes:

## 9) QA e criterios de aceite
- Testes obrigatorios:
- QA manual automatizado:
- Criterios de aceite por modulo:

## 10) Riscos e dependencias
- Riscos conhecidos:
- Mitigacoes:
- Dependencias internas:
- Dependencias externas:

## 11) MCPs necessarios (pesquisa + execucao)
Preencha e configure em `factory-workflow/config/mcp.toml`.
Para cada MCP, definir:
- Nome
- Proposito
- Escopo
- Credenciais (ENV vars)
- Rate limits
- Riscos e restricoes

Exemplos de categorias (ajuste conforme projeto):
- web-search (pesquisa)
- browser-automation (auditoria UI)
- repo (git/repo operations)
- docs (documentacao oficial)
- database (queries/inspecao)
- cloud (infra/deploy)
- payments (pagamentos)
- analytics (eventos)
- email (notificacoes)

## 12) Entregaveis iniciais
- `docs.md`
- `stack.md`
- `design-system.md`
- `mcp.md`
- `reference/**`

## 13) Diagramas (visao do cliente)
- Frontend flow (Mermaid) em `docs/projects/<projeto>/architecture/frontend-flow.md`
- Backend flow (Mermaid) em `docs/projects/<projeto>/architecture/backend-flow.md`
