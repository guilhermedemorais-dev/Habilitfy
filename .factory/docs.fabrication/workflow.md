# Workflow oficial: RPI (Research → Plan → Implement)

## Objetivo
Reduzir retrabalho, evitar overengineering e impedir reinvenção da roda.

A Factory é pragmática: **primeiro contexto e evidência**, depois **plano**, depois **execução**.

---

## Definição do fluxo
1) **Research**
   - Buscar evidências (docs oficiais, código existente, MCPs, referências)
   - Mapear riscos, trade-offs e alternativas
   - Registrar gaps se não houver cobertura

2) **Plan**
   - Definir escopo, arquivos e passos
   - Especificar testes e critérios de aceite
   - Consolidar evidências

3) **Implement**
   - Executar somente após **Plan aprovado**
   - Atualizar código + docs + testes

4) **QA**
   - Executar testes e auditorias após Implement
   - Para UI navegável, rodar `qa-e2e-browser-audit` (Chrome DevTools MCP)
   - Registrar relatórios e evidências

---

## Definition of Ready (DoR) — para iniciar Implement

A Implementação **só começa** se todos os itens abaixo estiverem OK:

- `plan.md` completo com:
  - escopo (o que entra / o que não entra)
  - arquivos alvo
  - passos de execução
  - passos de teste
  - critérios de aceite
  - riscos e mitigação
  - evidências (links)
- Sem gaps bloqueantes em `factory-workflow/context/core/gaps.md`
- **Plan aprovado** (gate humano)

### Como registrar “Plan aprovado” (padrão)
No topo do `plan.md`, incluir um bloco como:

```md
## Aprovação do Plan
- Status: APPROVED | CHANGES_REQUESTED | DRAFT
- Aprovador: <nome>
- Data: YYYY-MM-DD
- Observações: <curto>
```

---

## Definition of Done (DoD) — para considerar entregue

Uma entrega está “done” quando:
- testes definidos no `plan.md` foram executados e passaram
- evidências/relatórios foram anexados (onde aplicável)
- docs impactadas foram atualizadas
- decisões relevantes foram registradas (ADR/decisions.md)
- gates do `factory-workflow/cicd/gates.md` estão atendidos

---

## Artefatos canônicos por feature/ticket

Caminho sugerido:
- `factory-workflow/docs/projects/<projeto>/work/<feature>/`

Arquivos:
- `research.md` (evidências e links)
- `plan.md` (escopo, passos, testes, critérios)
- `progress.md` (compaction e handoff)
- `decisions.md` (decisões e trade-offs)

---

## Autonomia (skill resolver + engines)

1) Orchestrator recebe intent
2) Skill resolver detecta gaps e monta fila de agentes
3) Planner engine gera research + plan
4) Execution engine aplica mudanças aprovadas
5) Quality + Security engines validam e registram evidências
6) Doc engine atualiza docs e arquitetura
7) Distribution engine prepara release após QA

---

## Policy engine (não opcional)

- Nenhuma escrita sem plan aprovado
- Nenhum deploy sem evidência de QA
- Nenhuma decisão sem justificativa registrada
- Nenhuma ação destrutiva sem confirmação humana

(Ver: `factory-workflow/policies/policy-engine.md`)

---

## Regras de contexto

- Guideline: **keep context utilization < 40%**
- **Intentional compaction**: ao trocar de sessão, gerar `progress.md`
- Contexto grande = resumir, anexar arquivo e reduzir contexto ativo

---

## Políticas de MCP durante Research

- Outputs grandes de MCP vão para arquivo.
- O contexto ativo recebe apenas **sumário objetivo**.
- Evidências (links) ficam no `research.md` e/ou `plan.md`.
