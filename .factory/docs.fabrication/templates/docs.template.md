# docs.md - <NOME_PROJETO>

## Metadados
- Responsavel: <RESPONSAVEL>
- Data: <DATA>
- Versao: <VERSAO>

## Visao
Descreva problema, objetivo e nao-objetivos.
Exemplo: "Sistema de agendamento simples para pequenas clinicas. Nao inclui faturamento."

## Escopo
- Dentro: <LISTA>
- Fora: <LISTA>
- Restricoes: <LISTA>
Exemplo: "Dentro: agendar, remarcar, cancelar. Fora: pagamentos."

## Stakeholders e jornadas (se aplicavel)
- Personas: <LISTA>
- Jornadas: <LISTA>

## Requisitos Funcionais
- RF-001: <DESCRICAO>
- RF-002: <DESCRICAO>
Exemplo: "RF-001: Criar agendamento com data, hora e paciente."

## Requisitos Nao-Funcionais
- RNF-001: <DESCRICAO>
- RNF-002: <DESCRICAO>
Exemplo: "RNF-001: Logs de erro em todas as operacoes criticas."

## Regras de Negocio
- RN-001: <REGRA>
- Excecoes: <EXCECOES>
Exemplo: "RN-001: Nao permitir dois agendamentos no mesmo horario."

## Dados e Entidades (conceitual)
- Entidades: <LISTA>
- Campos importantes: <LISTA>
Exemplo: "Entidades: Paciente, Agenda, Agendamento."

## Fluxos e casos de uso
- Fluxo principal: <DESCRICAO>
- Erros esperados: <LISTA>

## Integracoes (contratos)
- Sistemas externos: <LISTA>
- Contratos: <DESCRICAO>

## Testes (estrategia por camada)
- Unit: <ESCOPO>
- Integration: <ESCOPO>
- E2E: <ESCOPO>
- Security: <ESCOPO>
- Load: <ESCOPO>

## CI/CD (gates esperados)
- Gates: <LISTA>
- Checklists: <LISTA>

## MCP/Registry (reuso)
- Servers: <LISTA>
- Registries: <LISTA>
- Evidencias esperadas: <LISTA>

## Design System (resumo)
- Tokens: <RESUMO>
- Componentes base: <LISTA>
- Acessibilidade: <RESUMO>

## Stack (resumo)
- Frontend: <RESUMO>
- Backend: <RESUMO>
- Database: <RESUMO>
- Auth: <RESUMO>
- Infra/Deploy: <RESUMO>
- Observability: <RESUMO>

## Backlog macro / milestones
- M1: <OBJETIVO>
- M2: <OBJETIVO>

## Gaps conhecidos
- GAP-001: <DESCRICAO>

## Checklist de completude do docs.md
- [ ] Visao e escopo completos.
- [ ] Requisitos e regras definidos.
- [ ] Dados e fluxos descritos.
- [ ] Testes e gates definidos.
- [ ] MCP e design system definidos.
- [ ] Stack definida.
- [ ] Gaps registrados em `factory-workflow/context/core/gaps.md` quando necessario.
