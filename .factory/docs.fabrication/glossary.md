# Glossário (Factory)

Este glossário existe para reduzir ambiguidade de termos.

## Termos

### Contexto (sources of truth)
Conjunto de documentos em `factory-workflow/context/*` que define regras, requisitos, políticas e padrões.

### Gap
Qualquer informação necessária para executar (plan/implement/QA) que está **indefinida**, **conflitante** ou **não coberta**. Deve ser registrado em `factory-workflow/context/core/gaps.md`.

### Research
Etapa de levantamento com **evidências**. Saída típica: `research.md` com links e conclusões.

### Plan
Documento executável (por humanos e agentes) com escopo, passos e testes. A Implementação só começa com plan aprovado.

### Plan aprovado
Gate humano explícito registrado no `plan.md` (ver `factory-workflow/docs/workflow.md`).

### Bot
Agente executável (normalmente Python via CLI local) com contrato de entrada/saída.

### Engine
Componente lógico de responsabilidade (planner, execution, quality, security, doc, distribution). Pode orquestrar bots.

### Gate
Critério de bloqueio em pipeline (CI/CD) ou em processo. Ver `factory-workflow/cicd/gates.md`.
