# T04 - Uploads e Storage Externo

## Objetivo
Tirar documentos sensíveis do disco local público e preparar a aplicação para storage externo privado.

## LLM recomendado
- Primário: `Claude Code`
- Executor técnico: `Codex CLI`
- Apoio opcional: `Blackbox/Minimax` para snippets S3/R2 e matriz de validação

## Contexto mínimo
- `server/index.ts`
- `server/kyc.ts`
- `server/routes.ts`
- `shared/kyc-schema.ts`
- `Dockerfile`
- `docs/deploy/vps-production-requirements.md`

## Escopo
- desenhar e implementar abstração de storage;
- parar de expor KYC por `/uploads` público;
- validar tipo, tamanho e nome lógico dos uploads;
- preparar compatibilidade com S3/R2.

## Entregáveis
- interface de storage;
- implementação local temporária controlada e implementação S3-compatible;
- política de acesso privado/URL assinada;
- documentação de variáveis de ambiente do storage.

## Critérios de aceite
- documentos KYC não ficam publicamente acessíveis por URL estática;
- código não depende de um diretório local específico para múltiplas instâncias;
- validação mínima de upload existe;
- configuração de storage fica explícita.

## Prompt pronto
```text
Task T04. Faça a migração arquitetural de uploads sensíveis para storage externo privado.

Escopo:
- abstração de storage
- parar de depender de /uploads público para KYC
- preparar S3/R2
- validação básica de upload

Arquivos permitidos:
- server/index.ts
- server/kyc.ts
- server/routes.ts
- shared/kyc-schema.ts
- Dockerfile
- docs/deploy/vps-production-requirements.md

Entregue:
1. patch mínimo viável
2. documentação de env/config
3. nota de rollout/migração

Não trate filas nessa task.
```
