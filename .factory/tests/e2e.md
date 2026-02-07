# E2E Tests

## Estrategia
Validar jornadas criticas ponta a ponta.

## Quando e obrigatorio
- Mudancas que afetam fluxo principal.
- Mudancas em UI ou integracoes criticas.

## Quando e opcional
- Mudancas internas sem impacto no fluxo.

## Criterios e evidencias
- Relatorios de execucao.
- Logs e resultados.

## Browser Audit (headed)
### Quando rodar
- UI navegavel com rotas principais.
- Mudancas em fluxos, inputs, performance ou usabilidade.

### Artefatos esperados
- Relatorio: `factory-workflow/tests/reports/qa-e2e-browser-audit/<timestamp>/report.md`
- Evidencias: screenshots/logs em `factory-workflow/tests/reports/qa-e2e-browser-audit/<timestamp>/artifacts/`

### Criterios de aceite minimos
- Sem erros criticos no console.
- Falhas 4xx/5xx relevantes reportadas.
- Baseline de performance registrado (tempos de carregamento).
- Validacoes de form e navegacao basica cobertas.
- A11y minimo reportado (labels/aria/contraste quando suportado).

### Nota sobre Playwright
- Playwright cobre E2E funcional.
- Chrome DevTools cobre auditoria/inspecao/performance/UX e pode coexistir.

