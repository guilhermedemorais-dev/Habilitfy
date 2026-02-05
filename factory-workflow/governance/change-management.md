# Change Management

## Objetivo
Controlar mudancas e garantir rastreabilidade.

## Tipos de mudanca
- Pequena: baixo risco, baixo impacto.
- Significativa: impacto moderado, pode afetar outros modulos.
- Critica: altera contratos, requisitos ou qualidade.
- Deploy/Release: mudanca operacional com impacto em ambiente.

## Exigencias por tipo
- Pequena: review + testes minimos.
- Significativa: review + testes completos + documentacao.
- Critica: review + testes completos + ADR + comunicacao.
- Deploy/Release: review + gates + aprovacao humana para producao.

## Regra
Mudanca que quebra contrato exige decisao registrada.

## Deploy/Release
- Deploy em producao exige aprovacao humana.
- Release exige tag, changelog e gates completos.

## Relacao
- Gates: factory-workflow/cicd/gates.md
- Deploy: factory-workflow/cicd/deploy.md
- Riscos: factory-workflow/governance/risk.md
- Quality bars: factory-workflow/context/quality/quality-bars.md
