# Research — Feature fictícia: "Exportar relatório em CSV"

## Objetivo
Permitir que o usuário exporte um relatório em CSV a partir da tela X, com filtros aplicados.

## Evidências / referências
- (exemplo) Padrão de export CSV (RFC 4180): https://www.rfc-editor.org/rfc/rfc4180
- (exemplo) Guia de encoding/Excel (UTF-8 BOM): https://stackoverflow.com/questions/17879198

## Descobertas
- Precisamos decidir encoding (UTF-8 vs UTF-8 BOM) por compatibilidade com Excel.
- Precisamos limitar volume (ex.: 100k linhas) ou stream.

## Alternativas
1) Gerar CSV no backend (stream)
   - Pró: não trava frontend
   - Contra: precisa endpoint e auth
2) Gerar CSV no frontend
   - Pró: simples se dataset já está carregado
   - Contra: memória/performance, dataset parcial

## Riscos
- Arquivos grandes → timeout / consumo de memória
- Fórmulas maliciosas em CSV (CSV injection) → precisa sanitizar

## Gaps
- Qual é o tamanho máximo esperado do relatório?
- O dataset completo está disponível no frontend ou só paginado?
- O produto precisa suportar Excel explicitamente?
