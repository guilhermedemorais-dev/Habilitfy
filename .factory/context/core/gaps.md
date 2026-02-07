# Gaps

## O que sao gaps
Gaps sao faltas, ambiguidades ou conflitos no contexto que bloqueiam decisao ou execucao.

## Template de gap (canonico)
- ID:
- Data: YYYY-MM-DD
- Descricao:
- Impacto:
- Owner:
- Status: OPEN | DECIDED | DEFERRED
- **Sugestao de Solucao:** (obrigatório - o agente DEVE propor uma solução para o dev aprovar)

## Regra
- Qualquer duvida bloqueante deve ser registrada aqui.
- **Todo gap DEVE incluir uma Sugestao de Solucao.** O desenvolvedor pode aprovar, rejeitar ou discutir.
- O desenvolvedor responde: "Aplique a sugestão do GAP-XXX" ou discute alternativas.


## Gaps Abertos

### GAP-CORE-001
- ID: GAP-CORE-001
- Data: 2026-01-13
- Descricao: Definir visao do sistema (por que existe, problema, publico-alvo, objetivos e nao objetivos).
- Impacto: BLOQUEIA
- Owner: TBD
- Status: OPEN

### GAP-CORE-002
- ID: GAP-CORE-002
- Data: 2026-01-13
- Descricao: Definir escopo dentro/fora, suposicoes, restricoes e dependencias externas.
- Impacto: BLOQUEIA
- Owner: TBD
- Status: OPEN

### GAP-CORE-003
- ID: GAP-CORE-003
- Data: 2026-01-13
- Descricao: Definir requisitos funcionais, nao funcionais e criterios de aceite.
- Impacto: BLOQUEIA
- Owner: TBD
- Status: OPEN

### GAP-CORE-004
- ID: GAP-CORE-004
- Data: 2026-01-13
- Descricao: Definir regras de negocio, excecoes e validacoes.
- Impacto: BLOQUEIA
- Owner: TBD
- Status: OPEN

### GAP-CORE-005
- ID: GAP-CORE-005
- Data: 2026-01-13
- Descricao: Definir entidades, campos, relacionamentos e dados sensiveis.
- Impacto: BLOQUEIA
- Owner: TBD
- Status: OPEN

### GAP-CORE-006
- ID: GAP-CORE-006
- Data: 2026-01-13
- Descricao: Definir glossario com termos de negocio e tecnicos.
- Impacto: BLOQUEIA
- Owner: TBD
- Status: OPEN

### GAP-CORE-007
- ID: GAP-CORE-007
- Data: 2026-01-13
- Descricao: Definir principios, prioridades e trade-offs.
- Impacto: BLOQUEIA
- Owner: TBD
- Status: OPEN


### GAP-TOOLING-002
- ID: GAP-TOOLING-002
- Data: 2026-01-19
- Descricao: Chrome DevTools MCP nao possui cliente/tooling implementado no runtime (bot existe, mas depende de MCP externo).
- Impacto: BLOQUEIA auditoria automatizada via CLI sem MCP externo.
- Owner: TBD
- Status: OPEN
- Next step: implementar cliente MCP (CDP) no runtime ou integrar executor externo.

## Gaps Resolvidos

### GAP-CORE-008
- ID: GAP-CORE-008
- Data: 2026-01-13
- Descricao: Canonico definido para qualidade: factory-workflow/context/quality/.
- Impacto: DOCUMENTACAO_INCONSISTENTE
- Owner: TBD
- Status: DECIDED

### GAP-TOOLING-001
- ID: GAP-TOOLING-001
- Data: 2026-01-17
- Descricao: Nao existia .gitignore para proteger `factory-workflow/config/mcp.toml` (arquivo real de configuracao MCP).
- Impacto: RISCO_DE_SECRET
- Owner: TBD
- Status: DECIDED
