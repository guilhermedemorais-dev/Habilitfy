# Deploy

## Ambientes
- dev: validacao rapida e iterativa.
- staging: validacao pre-producao.
- production: ambiente de producao.

## Objetivo por ambiente
- dev: integrar e detectar falhas cedo.
- staging: simular producao e validar release.
- production: entrega oficial ao usuario.

## Estrategia de release
- Releases baseadas em tags.
- Changelog obrigatorio.
- Aprovacao humana para producao.

## Deploy
- staging: automatico.
- production: somente com aprovacao humana (manual gate).

## Gestao de segredos
- Secrets somente em CI secrets.
- Proibido commitar segredos no repo.

## Checklist pre-deploy
- [ ] Testes executados conforme estrategia.
- [ ] Gates atendidos (`factory-workflow/cicd/gates.md`).
- [ ] Backup/rollback pronto.

## Checklist pos-deploy
- [ ] Metricas monitoradas.
- [ ] Logs sem erros criticos.
- [ ] Verificacao funcional basica.

## Rollback
- Acionar em falha critica ou degradacao.
- Registrar motivo e impacto.

## Relacoes
- Estrategia: `factory-workflow/cicd/strategy.md`
- Gates: `factory-workflow/cicd/gates.md`
- Observabilidade: `factory-workflow/context/tooling/observability.md`
- NFRs: `factory-workflow/context/quality/nonfunctional.md`
