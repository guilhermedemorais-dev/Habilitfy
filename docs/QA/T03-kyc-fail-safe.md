# T03 - KYC Fail-Safe

## Objetivo
Remover o comportamento permissivo do KYC e garantir falha segura quando o provedor externo estiver ausente ou degradado.

## LLM recomendado
- Primário: `Claude Code`
- Executor e testes: `Codex CLI`
- Apoio opcional: `Blackbox/Minimax` para tabela de estados e mensagens

## Contexto mínimo
- `server/kyc.ts`
- `server/routes.ts`
- `shared/kyc-schema.ts`

## Escopo
- eliminar autoaprovação quando `ANTHROPIC_API_KEY` não estiver configurada;
- revisar estados `pending`, `processing`, `requires_review`, `approved`, `rejected`;
- garantir mensagens seguras para frontend;
- separar aprovação automática de revisão manual.

## Entregáveis
- fluxo KYC fail-safe;
- persistência consistente de status;
- testes de ausência de provider e erro de análise.

## Critérios de aceite
- sem provider, usuário não é aprovado automaticamente;
- erro externo não vaza detalhes sensíveis;
- status do usuário e da verificação ficam coerentes;
- comportamento está documentado no código/testes.

## Prompt pronto
```text
Task T03. Corrija o fluxo KYC para fail-safe.

Problema principal:
- hoje o KYC pode assumir validade quando o provider externo não está configurado

Arquivos permitidos:
- server/kyc.ts
- server/routes.ts
- shared/kyc-schema.ts
- testes necessários

Entregue:
1. fluxo seguro sem autoaprovação implícita
2. testes para provider ausente e erro de análise
3. resumo dos estados finais do KYC

Não trate storage externo aqui. Só fail-safe do KYC.
```
