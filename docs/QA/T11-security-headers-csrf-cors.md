# T11 - Security Headers, CSRF e CORS

## Objetivo
Aplicar hardening web mínimo para produção no layer HTTP.

## LLM recomendado
- Primário: `Codex CLI`
- Revisor de segurança: `Claude Code`
- Apoio opcional: `Blackbox/Minimax` para CSP baseline

## Contexto mínimo
- `server/index.ts`
- `server/auth.ts`
- `server/routes.ts`
- `README.md`
- `docs/deploy/vps-production-requirements.md`

## Escopo
- adicionar `helmet` ou headers equivalentes;
- definir política de cookie `sameSite`;
- introduzir estratégia de proteção CSRF;
- declarar política de CORS explícita, se necessária.

## Entregáveis
- hardening HTTP aplicado;
- documentação curta das variáveis/políticas;
- testes básicos ou validação manual documentada.

## Critérios de aceite
- cookies de sessão têm política explícita;
- headers de segurança não são implícitos;
- rotas mutáveis têm proteção CSRF/origin coerente;
- CORS fica documentado e controlado.

## Prompt pronto
```text
Task T11. Faça hardening HTTP do projeto para produção.

Escopo:
- server/index.ts
- server/auth.ts
- server/routes.ts
- README.md
- docs/deploy/vps-production-requirements.md

Objetivo:
- security headers
- sameSite/cookies
- CSRF/origin protection
- CORS explícito

Entregue:
1. patch mínimo
2. documentação breve
3. observações de compatibilidade
```
