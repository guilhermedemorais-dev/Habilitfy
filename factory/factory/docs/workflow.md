# Workflow oficial: RPI (Research → Plan → Implement)

## Objetivo
Reduzir retrabalho, evitar overengineering e impedir reinvencao da roda.

## Definicao do fluxo
1) **Research**
   - Buscar evidencias (docs oficiais, MCP, referencias)
   - Mapear riscos e alternativas
   - Registrar gaps se nao houver cobertura
2) **Plan**
   - Definir escopo, arquivos e passos
   - Especificar testes e criterios de aceite
   - Consolidar evidencias
3) **Implement**
   - Executar somente apos Plan aprovado
   - Atualizar codigo + docs + testes
4) **QA**
   - Executar testes e auditorias apos Implement
   - Para UI navegavel, rodar `qa-e2e-browser-audit` (Chrome DevTools MCP)
   - Registrar relatorios e evidencias

## Regras de contexto
- **Keep context utilization < 40%** (guideline).
- **Intentional compaction**: ao trocar de sessao, gerar `progress.md`.
- Contexto grande = sumarizar, anexar arquivo e reduzir contexto ativo.

## Artefatos canonicos por feature/ticket
Caminho sugerido:
- `factory/docs/projects/<projeto>/work/<feature>/`

Arquivos:
- `research.md` (evidencias e links)
- `plan.md` (escopo, passos, testes)
- `progress.md` (compaction e handoff)
- `decisions.md` (decisoes e trade-offs)

## Gates humanos
- **Research review** (rapido, validar evidencias)
- **Plan review** (obrigatorio)
- **Implement** so inicia apos Plan aprovado

## Politica de MCP durante Research
- MCP outputs grandes **vao para arquivo**.
- O contexto ativo recebe apenas **sumario objetivo**.
- Evidencias (links) ficam no `research.md` e/ou `plan.md`.

## Definition of Ready (para iniciar Implement)
- `plan.md` completo com:
  - arquivos alvo
  - passos de execucao
  - passos de teste
  - evidencias (links)
- Nenhum gap aberto bloqueante em `factory/context/core/gaps.md`.
- Plan aprovado (gate humano).

## Conexoes obrigatorias
- Qualidade: `factory/context/quality/*`
- Gates CI/CD: `factory/cicd/gates.md` e `factory/cicd/checklist.md`
- Governanca: `factory/governance/*` (ADRs, risks)
