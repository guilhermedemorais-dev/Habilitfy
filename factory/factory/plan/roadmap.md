# Roadmap

## Fases

### 1) Fundacao
Objetivos:
- Contexto base definido.
- Governanca e quality bars estabelecidos.
- Políticas MCP e UI definidas.

Done quando:
- Contexto core completo.
- Quality bars definidos em factory/context/quality/quality-bars.md.
- Gates definidos em factory/cicd/gates.md.

### 2) Execucao
Objetivos:
- Bots operacionais.
- Prompts e policies aplicadas.
- Design system base completo.

Done quando:
- Bots documentados e executaveis.
- Checklists e DoD validos.
- Design system documentado.

### 3) Automacao
Objetivos:
- CI/CD conectado aos gates.
- Testes automatizados por camada.

Done quando:
- Templates definidos em factory/cicd/templates.md.
- Test strategy aplicada em factory/tests/*.

### 4) Escala
Objetivos:
- Reuso ampliado.
- Registry interno estabilizado.
- Operacao consistente.

Done quando:
- Registries definidos em factory/libs/mcp/registries/*.
- Operacao sustentavel sem gaps criticos.

## Notas
- Sem datas fixas; marcos por entrega.

## Atualizacao 2026-01-17 - RPI + MCP + Runtime

### Arquivos criados/alterados
- README.md
- factory/docs/quickstart.md
- factory/docs/workflow.md
- factory/context/tooling/runtime.md
- factory/context/tooling/mcp-policy.md
- factory/context/tooling/README.md
- factory/governance/automation-policy.md
- factory/governance/README.md
- factory/libs/mcp/servers/stackoverflow.md
- factory/libs/mcp/servers/README.md
- factory/cicd/gates.md
- factory/cicd/checklist.md
- factory/context/core/gaps.md
- factory/config/mcp.example.toml

### Principais mudancas
- Workflow oficial RPI (Research → Plan → Implement) com controles de contexto e compaction.
- Quickstart com bootstrap de projetos, runtime local e configuracao MCP via template.
- Politica MCP expandida com evidencias, StackOverflow auxiliar e regra de GAP.
- Runtime documentado (execucao local/CI, modo automatico conceitual).
- Gates/checklists reforcados com auditoria de dependencias e aprovacao humana.

### GAPs
- GAP-TOOLING-001 (resolvido): ausencia de .gitignore para proteger factory/config/mcp.toml.

### Proximos passos sugeridos
- Atualizar templates/prompts para refletir RPI e compaction.
- Implementar o daemon/CLI listener conforme contrato definido.
