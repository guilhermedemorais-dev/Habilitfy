# Checklists CI/CD

## Referencias
- `factory/docs/workflow.md`
- `factory/cicd/gates.md`
- `factory/cicd/strategy.md`
- `factory/cicd/deploy.md`
- `factory/governance/git-policy.md`

## Checklist de PR (antes de abrir PR)
- [ ] Escopo definido e alinhado com contexto aplicavel.
- [ ] Research/Plan registrados quando aplicavel.
- [ ] Testes exigidos planejados no `plan.md`.
- [ ] Uso de MCP/registry documentado (links + sumario).
- [ ] Verificacao de secrets e deps sensiveis concluida.
- [ ] Commits seguem `factory/governance/git-policy.md`.

## Checklist de PR (antes de merge)
- [ ] Gates de `factory/cicd/gates.md` atendidos.
- [ ] Estagios de `factory/cicd/strategy.md` executados conforme aplicavel.
- [ ] Testes unit/integration/e2e/security executados e com evidencias.
- [ ] Relatorio de browser audit (qa-e2e-browser-audit) quando houver UI navegavel.
- [ ] Evidencias do browser audit (screenshots/logs) anexadas.
- [ ] Baseline de performance registrada no relatorio.
- [ ] Quality bars atendidas quando aplicavel.
- [ ] Nenhuma inconsistencia de contexto.
- [ ] MCP evidenciado (links + sumario).

## Checklist de Release (antes de tag/deploy)
- [ ] Versao definida e tag preparada.
- [ ] Changelog atualizado.
- [ ] Gates atendidos em `factory/cicd/gates.md`.
- [ ] Plano de rollback definido.
- [ ] Checklist de pre-deploy completo (`factory/cicd/deploy.md`).

## Checklist de Deploy
- [ ] Staging validado.
- [ ] Aprovacao humana registrada para producao.
- [ ] Pos-deploy verificado (metricas, logs, funcional).

## Checklist de automacao local
- [ ] Execucao local de bots registrada quando aplicavel.
- [ ] Outputs e logs salvos em `factory/bots/runtime/out/`.
- [ ] Plan aprovado antes de Implement (workflow RPI).

## Criterios de bloqueio (hard fail)
- [ ] Gate critico falhou conforme `factory/cicd/gates.md`.
- [ ] Testes obrigatorios nao executados.
- [ ] Mudanca de contexto sem atualizacao documental.
- [ ] Falha de seguranca sem mitigacao.
