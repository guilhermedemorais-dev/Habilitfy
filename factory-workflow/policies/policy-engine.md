# Policy Engine Rules (não opcionais)

Regras mandatórias:
1) Nenhuma ação de escrita sem **plan aprovado**.
2) Nenhum deploy sem evidência de QA.
3) Nenhuma decisão sem justificativa registrada.
4) Nenhuma ação destrutiva sem confirmação humana.

## Pontos de enforcement
- Antes de qualquer operação de escrita por agente/bot.
- Antes do execution-engine aplicar mudanças.
- Antes do distribution-engine publicar artefatos.
- Antes de qualquer delete/reset.

## Artefatos (fontes)
- Decision records (ADR): `factory-workflow/governance/adr/**`
- Evidência de QA: `factory-workflow/tests/reports/**`
- Aprovação de plan: registrada no topo do `plan.md` (ver `factory-workflow/docs/workflow.md`).

## Heurística prática
Se existir dúvida relevante (requisito, risco, escopo, impacto):
- registre como GAP,
- pare a execução,
- peça confirmação.
