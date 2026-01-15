# docs.md - Agendamento Simples

## Visao
Sistema de agendamento simples para pequenas clinicas. Nao inclui faturamento.

## Escopo
- Dentro: criar, remarcar e cancelar agendamentos.
- Fora: pagamentos e prontuario.

## Requisitos Funcionais
- RF-001: Criar agendamento com data, hora e paciente.
- RF-002: Remarcar agendamento com registro de motivo.

## Requisitos Nao-Funcionais
- RNF-001: Logs de erro em operacoes criticas.
- RNF-002: Disponibilidade em horario comercial.

## Regras de Negocio
- RN-001: Nao permitir dois agendamentos no mesmo horario.

## Dados
- Entidades: Paciente, Agenda, Agendamento.

## Testes
- Unit: validacoes de regras.
- Integration: contratos com agenda.
- E2E: fluxo de criar e remarcar.

## CI/CD
- Gates: lint, unit, integration, security.

## MCP/Registry
- Servers: Context7.
- Registries: shadcn-vue.

## Design System
- Tokens: paleta neutra e feedback.
- Componentes base: buttons, inputs, modals.

## Stack
- Frontend: necessario.
- Backend: necessario.
- Database: relacional.

## Milestones
- M1: Contexto e regras.
- M2: MVP de agendamento.
