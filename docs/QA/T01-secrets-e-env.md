# T01 - Secrets e Env

## Objetivo
Eliminar exposição de segredos, corrigir o fluxo de configuração de ambiente e deixar o projeto pronto para operar com secrets fora do código.

## LLM recomendado
- Primário: `Claude Code`
- Executor de patch e validação final: `Codex CLI`
- Apoio opcional: `Blackbox/Minimax` para revisar templates de `.env` e runbook curto

## Contexto mínimo
- `.gitignore`
- `.env.example`
- `.env.production.example`
- `docs/deploy/hostinger-mysql-setup.md`
- `docs/deploy/vps-production-requirements.md`
- `scripts/deploy.sh`

## Escopo
- remover dependência operacional de `.env.production` local comprometido;
- padronizar templates de env;
- revisar scripts que ainda usam `.env` incorretamente para produção;
- escrever runbook curto de rotação e bootstrap seguro.

## Entregáveis
- templates de ambiente revisados;
- script ou documentação de bootstrap seguro;
- instrução objetiva de rotação de segredos;
- confirmação de que segredos reais não permanecem em arquivos rastreáveis do projeto.

## Critérios de aceite
- produção não depende de credencial hardcoded no repositório;
- deploy não usa `.env` de dev por engano;
- há passo claro para `SESSION_SECRET`, OAuth e credenciais de banco;
- runbook curto de rotação existe.

## Prompt pronto
```text
Task T01. Trabalhe apenas com secrets e configuração de ambiente.

Objetivo:
- endurecer a estratégia de env/secrets do projeto
- corrigir referências erradas a `.env` em fluxo de produção
- melhorar templates e documentação

Arquivos permitidos:
- .gitignore
- .env.example
- .env.production.example
- docs/deploy/hostinger-mysql-setup.md
- docs/deploy/vps-production-requirements.md
- scripts/deploy.sh

Entregue:
1. patches mínimos no repositório
2. runbook curto de rotação/boot seguro
3. resumo final com riscos residuais

Não faça mudanças fora desse escopo.
```
