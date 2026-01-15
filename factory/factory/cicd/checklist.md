# Checklists CI/CD

## Referencias
- `factory/cicd/gates.md`
- `factory/cicd/strategy.md`
- `factory/cicd/deploy.md`
- `factory/governance/git-policy.md`

## Checklist de PR (antes de abrir PR)
- [ ] Escopo definido e alinhado com contexto aplicavel.
- [ ] Documentacao atualizada quando regras/requisitos foram alterados.
- [ ] Testes exigidos pelo tipo de mudanca foram planejados.
- [ ] Uso de MCP/registry documentado quando houve mudanca em UI/componentes.
- [ ] Verificacao de secrets e deps sensiveis concluida.
- [ ] Commits seguem `factory/governance/git-policy.md`.

## Checklist de PR (antes de merge)
- [ ] Gates de `factory/cicd/gates.md` atendidos.
- [ ] Estagios de `factory/cicd/strategy.md` executados conforme aplicavel.
- [ ] Testes unit/integration/e2e/security executados e com evidencias.
- [ ] Quality bars atendidas quando aplicavel.
- [ ] Nenhuma inconsistência de contexto.
- [ ] PR segue `factory/governance/git-policy.md`.

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

## Criterios de bloqueio (hard fail)
- [ ] Gate critico falhou conforme `factory/cicd/gates.md`.
- [ ] Testes obrigatorios nao executados.
- [ ] Mudanca de contexto sem atualizacao documental.
- [ ] Falha de seguranca sem mitigacao.
