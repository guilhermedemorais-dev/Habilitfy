# Runtime

## Objetivo
Fornecer um runtime executável (Python + CLI) para bots da Factory.

## O que isso faz
- Carrega contratos dos bots em `factory-workflow/bots/<bot>.md`
- Carrega contexto a partir de `factory-workflow/context/INDEX.md` e arquivos referenciados
- Executa uma task com um LLM
- Escreve outputs em disco (nunca apenas stdout)
- Registra gaps em `factory-workflow/context/core/gaps.md` quando faltar contexto

## Requisitos
- Python 3.10+
- Acesso ao provider do LLM (ex.: OpenAI)

## Setup
1) Criar venv e instalar deps:
```bash
python -m venv .venv
. .venv/bin/activate
pip install -r factory-workflow/bots/runtime/requirements.txt
```

2) Configurar env vars:
```bash
cp factory-workflow/bots/runtime/.env.example .env
# edite .env
```

3) Revisar config do runtime:
- `factory-workflow/bots/runtime/config.yaml`

## Kickconfig (MCP)
Gera `factory-workflow/config/mcp.toml` (local, gitignored):
```bash
python factory-workflow/bots/runtime/cli.py kickconfig --workspace "/path/to/workspace"
```

## Usar PRDs do projeto (Docs.example)
Copie `Docs.example/` para a raiz do seu projeto e renomeie para `docs/`:
```bash
cp -R Docs.example docs
```
Preencha `docs/prd.md`, `docs/ui-ux.md`, `docs/tech.md`.

Depois rode o bot que distribui contexto:
```bash
python factory-workflow/bots/runtime/cli.py run context-sync \
  --task "Distribuir PRDs de ./docs para factory-workflow/context" \
  --workspace "/path/to/workspace"
```

Opcional: rodar em sequência via daemon + queue:
```bash
# terminal 1
python factory-workflow/bots/runtime/cli.py daemon --workspace "/path/to/workspace"

# terminal 2
python factory-workflow/bots/runtime/cli.py enqueue context-sync \
  --task "Distribuir PRDs" \
  --workspace "/path/to/workspace"

python factory-workflow/bots/runtime/cli.py enqueue planner \
  --task "Research + Plan + Queue para feature atual" \
  --workspace "/path/to/workspace"
```

## Rodar bot
```bash
python factory-workflow/bots/runtime/cli.py run orchestrator \
  --task "Summarize current plan" \
  --workspace "/path/to/workspace"
```

Dev bot (requer project path sob `/apps/<project>`):
```bash
python factory-workflow/bots/runtime/cli.py run dev \
  --task "Implementar feature X" \
  --workspace "/path/to/workspace" \
  --project "/apps/meu-projeto"
```

## Modo autônomo (daemon de jobs)
Você pode rodar um daemon local que fica consumindo jobs de uma fila (arquivos JSON/YAML).

1) Suba o daemon:
```bash
python factory-workflow/bots/runtime/cli.py daemon --workspace "/path/to/workspace"
```

2) Enfileire jobs manualmente:
```bash
python factory-workflow/bots/runtime/cli.py enqueue planner \
  --task "Gerar plan" \
  --workspace "/path/to/workspace"
```

### Autopilot (fluxo recomendado)

**Start**: faz `context-sync` + `planner` e gera um `plan.md` em modo **DRAFT**:
```bash
python factory-workflow/bots/runtime/cli.py autopilot-start \
  --workspace "/path/to/workspace" \
  --feature "current"
```

Depois você revisa e muda o topo do `plan.md` para `Status: APPROVED`.

**Build**: só enfileira implementação após o plan estar **APPROVED**:
```bash
python factory-workflow/bots/runtime/cli.py autopilot-build \
  --workspace "/path/to/workspace" \
  --feature "current" \
  --project "/apps/<seu-projeto>" \
  --with-e2e
```

Isso enfileira (ordem):
1) dev
2) qa-unit
3) qa-integration
4) qa-e2e (opcional com `--with-e2e`)
5) qa-security
6) review (gera `release.md`)

Notas:
- o plan fica em: `factory-workflow/docs/autopilot/<feature>/plan.md`
- `autopilot-build` falha (BLOCKED) se o plan não estiver aprovado
- o release checklist fica em: `factory-workflow/docs/autopilot/<feature>/release.md`

## Outputs
- Execução: `factory-workflow/bots/runtime/out/<timestamp>/<bot>/`
- `response.txt` (resposta bruta)
- `summary.md` (resumo)
- `jobs.json` (se o bot sugeriu jobs)

## Notas de segurança
- Se contexto faltar, o bot deve registrar GAP e parar.
- Paths são validados (SafeFS); path traversal é bloqueado.
- Dev bot só escreve dentro de `/apps/<projeto>`.
