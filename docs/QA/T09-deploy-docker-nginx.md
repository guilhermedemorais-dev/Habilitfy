# T09 - Deploy, Docker e Nginx

## Objetivo
Fechar as lacunas de empacotamento e deploy para uma operação previsível em produção.

## LLM recomendado
- Primário: `Claude Code`
- Executor de arquivos e validação: `Codex CLI`
- Apoio opcional: `Blackbox/Minimax` para compose/nginx snippets

## Contexto mínimo
- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `scripts/deploy.sh`
- `deploy.sh`
- `docs/deploy/vps-production-requirements.md`

## Escopo
- revisar imagens, portas expostas e volumes;
- corrigir script de deploy inconsistente;
- deixar Nginx e runtime alinhados ao novo desenho;
- formalizar execução web x worker.

## Entregáveis
- compose e scripts consistentes;
- documentação de deploy revisada;
- checklist de produção atualizado.

## Critérios de aceite
- MySQL/Redis não precisam ficar expostos publicamente;
- deploy de produção não usa arquivos/env errados;
- processo web e workers ficam claros;
- documentação reflete o estado real do repositório.

## Prompt pronto
```text
Task T09. Corrija a camada de deploy/container/proxy do projeto.

Escopo:
- Dockerfile
- docker-compose.yml
- docker-compose.dev.yml
- scripts/deploy.sh
- deploy.sh
- docs/deploy/vps-production-requirements.md

Entregue:
1. patches mínimos
2. docs de deploy atualizadas
3. checklist final de runtime

Não tratar regra de negócio nem queries aqui.
```
