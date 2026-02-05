# Quality Bars

## Objetivo
Definir barras minimas de qualidade inegociaveis para qualquer entrega.

## Barras por tipo de mudanca

### Docs/Contexto
- Consistencia interna (sem contradicao).
- Referencias corretas entre arquivos.
- Review obrigatorio.
- Evidencia de leitura do contexto.

### Bots/Runtime (scripts)
- Lint/format quando existir.
- Testes minimos de execucao (smoke/cli).
- Review obrigatorio.
- Logs e escrita segura validados.

### Design-system/UI
- Lint/format quando existir.
- Testes unit/integration quando aplicavel.
- Aderencia a tokens e acessibilidade.
- Evidencia de reuso via registry/MCP.

### Integracao/Tooling (MCP)
- Lint/format quando existir.
- Testes de integracao quando aplicavel.
- Evidencia de compatibilidade com registries/servers.
- Review obrigatorio.

### Produto (quando aplicavel)
- Lint/format quando existir.
- Unit/integration obrigatorios.
- e2e quando aplicavel.
- Security obrigatorio.
- Review obrigatorio.

## Criterios minimos comuns
- Lint/format quando existir.
- Testes minimos por tipo de mudanca.
- Review obrigatorio.
- Evidencia de reuso (MCP/registry) quando aplicavel.

## Conexao com gates
- Estes quality bars viram gates em `factory-workflow/cicd/gates.md`.
- Falha em bar minimo = hard fail.
