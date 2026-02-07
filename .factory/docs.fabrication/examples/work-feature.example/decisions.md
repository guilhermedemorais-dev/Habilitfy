# Decisions — Feature fictícia: "Exportar relatório em CSV"

## 2026-01-29 — Encoding do CSV
- Decisão: usar UTF-8 com BOM
- Motivo: compatibilidade com Excel em alguns ambientes
- Trade-off: alguns sistemas podem preferir UTF-8 sem BOM
- Evidência: https://stackoverflow.com/questions/17879198

## 2026-01-29 — Mitigação CSV injection
- Decisão: prefixar com `'` valores que começam com `=`, `+`, `-`, `@`
- Motivo: reduzir risco de execução de fórmula ao abrir em Excel
- Nota: validar impactos em usuários avançados
