# Plan — Feature fictícia: "Exportar relatório em CSV"

## Aprovação do Plan
- Status: APPROVED
- Aprovador: Guilherme
- Data: 2026-01-29
- Observações: exemplo didático

---

## Contexto e referências
- Research: `research.md`
- Evidências:
  - RFC 4180: https://www.rfc-editor.org/rfc/rfc4180

## Escopo
### Inclui
- Botão "Exportar CSV" na tela X
- Export respeita filtros aplicados
- Sanitização básica contra CSV injection

### Não inclui
- Export em XLSX
- Export assíncrono com job queue

## Critérios de aceite
- [ ] Usuário consegue baixar CSV com dados filtrados
- [ ] CSV abre no Excel (definição do encoding registrada)
- [ ] Campos iniciando com `=`, `+`, `-`, `@` são escapados (mitigação CSV injection)

## Arquivos alvo (intenção)
- `apps/<projeto>/frontend/...` (botão + chamada)
- `apps/<projeto>/backend/...` (endpoint de export)
- `apps/<projeto>/tests/...`

## Plano de execução
1) Confirmar requisitos pendentes (tamanho, paginação, compat Excel)
2) Definir abordagem (backend stream vs frontend)
3) Implementar endpoint de export (stream)
4) Implementar botão no frontend + download
5) Implementar sanitização
6) Adicionar testes
7) Rodar QA (e2e se aplicável)

## Plano de testes
### Unit
- Sanitização CSV injection

### Integration
- Endpoint retorna CSV com headers e encoding esperado

### E2E
- Navegar até tela X, aplicar filtro, exportar, validar arquivo baixado

## Riscos e mitigação
- Dataset grande → stream no backend + limites
- Compat Excel → avaliar UTF-8 BOM e registrar decisão
