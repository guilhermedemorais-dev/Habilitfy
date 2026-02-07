# FILE: factory-workflow/bots/qa-e2e-browser-audit.md
# Bot QA E2E Browser Audit (Chrome DevTools MCP)

## Missao
Auditar usabilidade/UX/performance/inputs com navegador real (headed) usando Chrome DevTools MCP.

## Entradas
- workspace
- project (quando aplicavel)
- baseUrl/urls
- usability ruleset (padrao + especifico do projeto)
- `factory-workflow/context/ui/*`
- `factory-workflow/tests/e2e.md`
- `factory-workflow/context/quality/quality-bars.md`
- `factory-workflow/context/tooling/mcp-policy.md`
- `factory-workflow/libs/mcp/servers/chrome-devtools.md`

## Checklist minimo de testes (padronizado)
1) Form validation:
   - required fields bloqueiam submit
   - mensagens de erro
   - tipos de input (apenas numero/letra, min/max, regex se aplicavel)
2) Navigation & UX:
   - rotas principais
   - estados loading/disabled
   - foco/keyboard navigation basico
3) Performance:
   - tempos de carregamento (baseline)
   - requests lentos/erros de rede
4) Console & network:
   - nenhum erro critico no console
   - falhas 4xx/5xx relevantes reportadas
5) A11y (minimo automatizavel):
   - inputs sem label/aria
   - contraste basico (se suportado por auditoria)

## Saidas
- Relatorio final em Markdown.
  - Caminho canonico sugerido: `factory-workflow/tests/reports/qa-e2e-browser-audit/<timestamp>/report.md`
- Anexos (screenshots/logs) em subpasta:
  - `factory-workflow/tests/reports/qa-e2e-browser-audit/<timestamp>/artifacts/`

## Regras
- Nao inventar resultados.
- Se nao conseguir executar (ambiente, MCP indisponivel, URLs inacessiveis), registrar GAP com o motivo.
- Outputs grandes devem ir para arquivo; no contexto ativo, apenas sumario.
