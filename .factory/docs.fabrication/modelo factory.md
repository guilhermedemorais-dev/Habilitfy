# Modelo Factory (Prompt Mestre para uso do Framework)

Este arquivo e um guia passo a passo para orientar o usuario a:
1) levantar requisitos completos com um agente GPT externo,
2) registrar toda a documentacao no Factory,
3) iniciar o desenvolvimento com contexto profundo e sem ambiguidade.

Use este modelo dentro do seu agente GPT (Factory Architect) para gerar
as informacoes certas e criar os prompts corretos para conversar com o Factory.

---

## 1) Objetivo do modelo
- Garantir que toda feature/modulo seja construida a partir de uma referencia detalhada.
- Evitar implementacoes com contexto raso.
- Padronizar a passagem de informacoes para o Factory (Research + Plan + Tasks).

---

## 2) Fluxo geral (sempre)
1) Usuario descreve a intencao.
2) Agente GPT levanta requisitos completos (checklist total).
3) Usuario registra tudo em `factory-workflow/docs/projects/<projeto>/reference/`.
4) Usuario pede ao Factory para iniciar (Research + Plan + Queue).
5) Factory executa apenas com plan aprovado.

---

## 3) Saidas obrigatorias no Factory
Para qualquer projeto/feature, os seguintes arquivos devem existir:

- `factory-workflow/docs/projects/<projeto>/docs.md`
- `factory-workflow/docs/projects/<projeto>/stack.md`
- `factory-workflow/docs/projects/<projeto>/design-system.md`
- `factory-workflow/docs/projects/<projeto>/mcp.md`
- `factory-workflow/docs/projects/<projeto>/reference/**`
- `factory-workflow/docs/projects/<projeto>/architecture/frontend-flow.md`
- `factory-workflow/docs/projects/<projeto>/architecture/backend-flow.md`

Estrutura minima da referencia:
- `reference/modules/<modulo>/overview.md`
- `reference/modules/<modulo>/pages/<pagina>.md`
- `reference/modules/<modulo>/rules.md`
- `reference/modules/<modulo>/flows.md`
- `reference/modules/<modulo>/data-contracts.md`

Templates:
- `factory-workflow/docs/templates/reference-module.template.md`
- `factory-workflow/docs/templates/reference-page.template.md`

---

## 4) Checklist completo (Kickoff do zero)
O agente GPT deve coletar e preencher tudo:

- Identidade do projeto (nome, objetivo, publico, metricas)
- Escopo funcional (modulos, paginas, fluxos, regras de negocio)
- Dados e contratos (entidades, schemas, APIs, eventos)
- Integracoes externas (contratos, webhooks, limites)
- Stack e arquitetura (frontend, backend, db, infra, CI/CD)
- NFRs (performance, disponibilidade, seguranca, compliance, acessibilidade)
- Design system (tokens, componentes, tipografia, grid)
- QA (testes obrigatorios, criterios de aceite)
- Riscos e dependencias
- MCPs necessarios (pesquisa + execucao)
- Diagramas frontend/backend (Mermaid) para visualizacao de arquitetura

Checklist completo:
- `factory-workflow/docs/templates/project-kickoff.checklist.md`

---

## 5) Checklist completo (Takeover de projeto existente)
Para projetos ja em andamento, o agente GPT deve mapear:

- Estrutura atual do repo e stack
- Arquitetura atual
- Integracoes e ambientes
- Testes existentes e gaps
- Backlog e divida tecnica
- Documentacao faltante
- MCPs necessarios

Checklist completo:
- `factory-workflow/docs/templates/project-takeover.checklist.md`

---

## 6) Prompt para o agente GPT (Factory Architect)

Use este prompt no agente GPT:

"""
Voce e o Factory Architect. Seu trabalho e levantar requisitos completos e
entregar documentacao 100% detalhada para o Factory.

Regras:
- Nao invente requisitos.
- Se faltar info, pergunte ate completar.
- Estruture a documentacao no formato do Factory.
- Inclua MCPs necessarios para pesquisa e execucao.
- Entregue tudo pronto para copiar no repo.

Entregaveis:
1) docs.md
2) stack.md
3) design-system.md
4) mcp.md
5) reference/** (modulos, paginas, regras, fluxos, data-contracts)
6) architecture/frontend-flow.md
7) architecture/backend-flow.md
"""

---

## 7) Prompts para comunicar com o Factory (depois que a documentacao estiver pronta)

### Prompt A — Kickstart (novo projeto)
"""
Start projeto <PROJETO>.
Leia:
- docs/projects/<projeto>/docs.md
- docs/projects/<projeto>/stack.md
- docs/projects/<projeto>/design-system.md
- docs/projects/<projeto>/mcp.md
- docs/projects/<projeto>/reference/**

Entregue:
1) Research completo com evidencias
2) Plan detalhado (escopo, arquivos, passos, testes)
3) Queue de tasks ordenadas
4) Gaps encontrados (se houver)

Nao iniciar implementacao sem plan aprovado.
"""

### Prompt B — Nova feature/modulo
"""
Planejar e implementar feature <FEATURE> no projeto <PROJETO>.
Baseie-se em:
- docs/projects/<projeto>/reference/**
- docs/projects/<projeto>/work/<feature>/research.md (se existir)

Entregue:
- research.md (se faltar)
- plan.md completo
- tasks ordenadas
"""

### Prompt C — Projeto existente (gap analysis)
"""
Assuma o projeto <PROJETO>.
Leia docs e codigo atual e entregue:
- lista de gaps
- plano de estabilizacao
- prioridades imediatas
- MCPs faltantes
"""

---

## 8) Regra final
O Factory nao deve implementar nada sem:
- Plan aprovado
- Referencia completa
- MCPs configurados

Se algo estiver faltando, registrar GAP e parar.
