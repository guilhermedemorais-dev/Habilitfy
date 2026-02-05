# Checklist de Entrega (Codex / Bot-Dev / Bot-Review)

## Objetivo
Garantir que toda entrega respeite contexto, quality bars e gates.

## Referencias
- `factory-workflow/context/quality/quality-bars.md` (se existir)
- `factory-workflow/cicd/gates.md`

## Antes de comecar
- [ ] `factory-workflow/context/INDEX.md` lido.
- [ ] Escopo validado.
- [ ] Gaps inexistentes ou resolvidos em `factory-workflow/context/core/gaps.md`.

## Durante a execucao
- [ ] Reuso aplicado (MCP/registry/design-system quando aplicavel).
- [ ] Implementacao dentro do workspace permitido.
- [ ] Testes conforme `factory-workflow/tests/*` executados ou preparados.

## Antes de finalizar
- [ ] Quality bars atendidas.
- [ ] Gates atendidos em `factory-workflow/cicd/gates.md`.
- [ ] Evidencias registradas (contexto, MCP/registry, testes).

## Criterios de bloqueio (hard fail)
- [ ] Gap aberto em `factory-workflow/context/core/gaps.md`.
- [ ] Requisito ou regra inventada.
- [ ] Escrita fora do workspace permitido.
- [ ] Falha em gates criticos.
