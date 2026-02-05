# Template textual de pipeline CI/CD

## Referencias
- `factory-workflow/cicd/strategy.md`
- `factory-workflow/cicd/gates.md`

## Tabela de jobs
| Job | Objetivo | Inputs | Outputs/Artefatos | Condicao | Cache | Paralelo? | Observacoes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| setup | Preparar ambiente e dependencias | repo, lockfiles | ambiente pronto | sempre | deps | nao | Deve rodar antes dos demais jobs |
| lint/format | Validar estilo e formatacao | codigo, configs | relatorio lint/format | push/PR | deps | sim | Falha bloqueia conforme gates |
| typecheck | Validar tipos/contratos | codigo, configs | relatorio typecheck | push/PR | deps | sim | Opcional quando stack nao tiver tipagem |
| unit | Testes unitarios | codigo, testes | relatorio unit + cobertura | push/PR | deps | sim | Gate hard por padrao |
| integration | Testes de integracao | codigo, testes, servicos simulados | relatorio integration | PR/merge | deps | sim | Aplicavel quando houver integracoes |
| e2e | Testes ponta a ponta | app, ambiente | relatorio e2e | merge/release | deps | nao | Pode exigir ambiente dedicado |
| security | SAST/SCA/secret scan | codigo, deps | relatorio security | PR/merge | deps | sim | Gate hard |
| load (opc) | Testes de carga | build, ambiente | relatorio load | release | deps | nao | Executar quando aplicavel |
| build/package | Gerar artefatos | codigo, version | artefatos versionados | merge/release | deps+build | nao | Gate hard |
| deploy (opc) | Publicar | artefatos | deploy logs | release | build | nao | Somente quando habilitado |

## Politica de cache
- Cache de dependencias (deps) baseado em lockfiles.
- Cache de build artifacts quando aplicavel.
- Invalidar cache em mudanca de lockfiles, toolchain ou versao.

## Politica de secrets/variaveis
- Nunca commitar secrets.
- Usar CI secrets/variables por ambiente.
- Rotacionar e registrar mudancas criticas.

## Estrategia de branches/tags
- PR: setup + lint/format + typecheck + unit + security + integration (se aplicavel).
- main/merge: pipeline completo conforme `factory-workflow/cicd/gates.md`.
- release tag: pipeline completo + build/package + deploy (se habilitado).

## Execucao local (simulacao)
- Rodar etapas individualmente conforme scripts do projeto.
- Validar lint/format, typecheck, unit e security localmente antes do PR.
- Registrar resultados quando exigido por `factory-workflow/cicd/gates.md`.
