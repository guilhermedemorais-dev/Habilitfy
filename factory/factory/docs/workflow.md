# Workflow

## Fluxo completo
1) Ideia inicial
2) Criar `docs.md` do projeto
3) Distribuir `docs.md` para `factory/context/*`
4) Rodar gates humanos
5) Iniciar build por milestones

## Gates humanos (nao avance se)
- Gaps abertos em `factory/context/core/gaps.md`.
- Contexto incompleto ou contraditorio.
- Quality bars nao atendidas.

## Revisao
- Checklist operacional: `factory/cicd/checklist.md`
- DoD: `factory/context/quality/definition-of-done.md`

## Sincronizacao
- Se `docs.md` mudar, atualizar `factory/context/*`.
- Se `factory/context/*` mudar, revisar o `docs.md`.
