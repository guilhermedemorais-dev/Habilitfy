# Quickstart (RPI + Runtime local)

## Pre-requisitos
- Python 3.10+ + venv
- CLI local do runtime (Python)
- Git

## Conceito base
- **Executor de IA** (IDE assistant / LLM executor) edita arquivos.
- **Bots Python** so executam via **CLI local** (ou CI configurado).
- **Engines + Agents** definem contratos de entrada/saida e permissoes.
- **Skill resolver** monta fila de execucao e aplica politicas.

## Setup minimo do runtime

1) Criar e ativar venv:
```bash
python -m venv .venv
. .venv/bin/activate
```

2) Instalar deps do runtime:
```bash
pip install -r factory-workflow/bots/runtime/requirements.txt
```
> Se esse arquivo nao existir, registre GAP em `factory-workflow/context/core/gaps.md`.

3) Configurar variaveis de ambiente (sem tokens em repo):
```bash
cp factory-workflow/bots/runtime/.env.example .env
# edite .env com suas variaveis locais
```

4) Revisar configuracao local:
- `factory-workflow/bots/runtime/config.yaml`

5) Configurar MCPs (template + env vars):
```bash
cp factory-workflow/config/mcp.example.toml factory-workflow/config/mcp.toml
# edite factory-workflow/config/mcp.toml com ENV:SUAS_VARIAVEIS
```
> Lembre de adicionar `factory-workflow/config/mcp.toml` ao `.gitignore`.

## Criar projeto dentro da filosofia Factory

1) Criar docs do projeto:
- Pasta: `factory-workflow/docs/projects/<nome>/`
- Arquivo: `factory-workflow/docs/projects/<nome>/docs.md`
- Base: `factory-workflow/docs/templates/docs.template.md`

2) Definir stack, design system e MCP:
- `factory-workflow/docs/templates/stack.template.md`
- `factory-workflow/docs/templates/design-system.template.md`
- `factory-workflow/docs/templates/mcp.template.md`

3) Organizar trabalho por feature:
- `factory-workflow/docs/projects/<projeto>/work/<feature>/`
- arquivos canonicos: `research.md`, `plan.md`, `progress.md`, `decisions.md`

## Rodar bots via CLI local

Exemplo (orchestrator):
```bash
python factory-workflow/bots/runtime/cli.py run orchestrator \
  --task "Sumarizar plano atual" \
  --workspace "."
```

Exemplo (dev bot - escreve apenas em /apps/<projeto>):
```bash
python factory-workflow/bots/runtime/cli.py run dev \
  --task "Implementar feature X" \
  --workspace "." \
  --project "/apps/<projeto>"
```

## Rodar auditoria de browser (QA)

Exemplo (qa-e2e-browser-audit):
```bash
python factory-workflow/bots/runtime/cli.py run qa-e2e-browser-audit \
  --task "Browser audit: baseUrl=https://app.exemplo.com urls=[/login,/checkout] ruleset=padrao+projeto" \
  --workspace "." \
  --project "/apps/<projeto>"
```

Requer `factory-workflow/config/mcp.toml` com `[chrome_devtools]` habilitado (ou `FACTORY_MCP_CONFIG`).

Notas:
- `--workspace` sempre aponta para a raiz do repo.
- O dev bot **nao escreve fora de** `/apps/<projeto>` (protecao de path).
- Relatorios e artefatos do browser audit ficam em `factory-workflow/tests/reports/qa-e2e-browser-audit/`.

## Troubleshooting
- MCP falhou ou nao cobriu o tema? **Registre GAP e pare.**
- Contexto muito grande? **Gerar `progress.md` e iniciar nova sessao.**
- Manter contexto sob controle: **keep context utilization < 40%**.

## Links essenciais
- Workflow RPI: `factory-workflow/docs/workflow.md`
- Runtime local: `factory-workflow/context/tooling/runtime.md`
- Politica MCP: `factory-workflow/context/tooling/mcp-policy.md`
- MCP libs: `factory-workflow/libs/mcp/README.md`
- Arquitetura autonoma: `factory-workflow/docs/architecture/autonomous-factory.md`
