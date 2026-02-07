# Runtime local (bots + CLI)

## O que e
Runtime e o executor local de bots (Python + CLI). Ele **carrega contratos** em `factory-workflow/bots/*.md` e executa tarefas com base no contexto.

## Responsabilidades
- Executar bots via CLI local.
- Escrever outputs e logs em disco (nao apenas stdout).
- Respeitar allowlist de paths e protecoes de escrita.

## Modelo de execucao
- **Local (default):** devs executam via CLI.
- **CI (opcional):** requer configuracao explicita de secrets, permissao de escrita e gates.

## Seguranca
- **Dev bot** so escreve em `/apps/<projeto>`.
- **Bots de research/QA** devem operar em modo read-only quando aplicavel.
- Qualquer tentativa de path traversal deve ser bloqueada pelo runtime.

## Modo automatico (agent daemon) - contrato, sem implementacao

Arquitetura (conceitual):
- Um daemon local fica em modo listen.
- O **Executor de IA** grava um **job request file** (JSON/YAML).
- O daemon valida, executa e grava outputs/logs.

Contrato minimo do job request:
- `action`: string (ex.: "run")
- `bot`: string (ex.: "planner")
- `task`: string
- `workspace`: path absoluto
- `project`: path absoluto (opcional)
- `constraints`: lista/objeto (limites, allowlist, read-only)

Exemplo (JSON):
```json
{
  "action": "run",
  "bot": "planner",
  "task": "Mapear riscos e dependencias",
  "workspace": "/path/to/workspace",
  "project": "/apps/my-project",
  "constraints": {
    "read_only": true,
    "allowed_paths": ["/factory-workflow"]
  }
}
```

Exemplo (YAML):
```yaml
action: run
bot: planner
task: Mapear riscos e dependencias
workspace: /path/to/workspace
project: /apps/my-project
constraints:
  read_only: true
  allowed_paths:
    - /factory-workflow
```

## Outputs e logs
- Saida canonica: `factory-workflow/bots/runtime/out/<timestamp>/<bot>/`
- Log sugerido: `factory-workflow/bots/runtime/out/runtime.log`
