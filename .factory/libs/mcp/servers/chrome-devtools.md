# Chrome DevTools (MCP Server)

## Descricao
Chrome DevTools Protocol (CDP) e a interface oficial de automacao/inspecao do Chrome. No Factory, ele serve para auditoria de UI/usabilidade/performance com navegador real (headed).

## Para que serve no Factory
- Auditar UX, usabilidade e inputs com navegador real.
- Coletar evidencias de DOM, console e network.
- Gerar relatorios com timings de performance e sinais de acessibilidade.

## Capacidades
- DOM inspection (estrutura, atributos, estado).
- Form validation (required, min/max, regex, tipos de input).
- Console e network errors.
- Screenshots (full e por viewport).
- Performance timings (navigation, paint, LCP/TBT quando suportado).
- Lighthouse-like audits (quando suportado pelo MCP).
- Accessibility signals (labels/aria, contraste basico quando suportado).

## Quando usar
- Projetos com UI navegavel.
- Auditoria de usabilidade/performance/inputs.
- QA apos Implement para evidencias objetivas.

## Quando NAO usar
- Quando nao existe UI navegavel.
- Para fluxo funcional E2E completo (usar Playwright). O CDP foca auditoria/inspecao.
- Quando o contexto interno ja cobre a evidenca exigida.

## Regras de evidencia
Sempre gerar relatorio com:
- URLs testadas
- Checks executados
- Falhas encontradas
- Artefatos (screenshots/logs)

## Politica de blob
- Output grande vai para arquivo dedicado.
- O contexto ativo recebe apenas um sumario curto.

## Integracao com workflow RPI
- Usado na fase **QA** apos Implement.
- Referenciar o bot `factory-workflow/bots/qa-e2e-browser-audit.md`.

## Campos recomendados (placeholders, sem tokens)
- endpoint: `ENV:CHROME_DEVTOOLS_ENDPOINT`
- executable: `ENV:CHROME_DEVTOOLS_EXECUTABLE`
- browser_channel: `ENV:CHROME_DEVTOOLS_CHANNEL`
- headless: `ENV:CHROME_DEVTOOLS_HEADLESS`
- output_dir: `ENV:CHROME_DEVTOOLS_OUTPUT_DIR`
- timeout_ms: `ENV:CHROME_DEVTOOLS_TIMEOUT_MS`
