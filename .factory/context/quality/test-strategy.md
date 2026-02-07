# Test Strategy

## Objetivo
Definir como testar e quais evidencias sao obrigatorias por camada.

## Camadas

### Unit
- Objetivo: validar comportamento isolado.
- Cobre: funcoes e componentes isolados.
- Nao cobre: integracoes externas.
- Evidencias: relatorio de testes e cobertura quando aplicavel.

### Integration
- Objetivo: validar integracoes entre modulos.
- Cobre: contratos e fluxos entre servicos.
- Nao cobre: cenarios ponta a ponta completos.
- Evidencias: relatorio de integracao.

### E2E
- Objetivo: validar fluxos ponta a ponta.
- Cobre: jornada completa do usuario/sistema.
- Nao cobre: detalhes internos.
- Evidencias: relatorio e logs de execucao.

### Security
- Objetivo: reduzir riscos de seguranca.
- Cobre: SAST/SCA/secret scan e verificacoes basicas.
- Nao cobre: auditorias profundas sem escopo.
- Evidencias: relatorios de security.

### Load
- Objetivo: validar performance e carga.
- Cobre: throughput e latencia em cenarios definidos.
- Nao cobre: tuning fora do escopo.
- Evidencias: relatorios de carga.

## Politica de dados de teste
- Ver `factory-workflow/tests/test-data.md` (se existir).

## Minimo exigido por tipo de mudanca
- Docs/contexto: validacao de referencias e consistencia.
- Bots/runtime: unit + integration (quando aplicavel) + smoke/cli.
- Design-system/UI: unit + integration/e2e quando aplicavel.
- MCP/tooling: integration + security.
- Produto: unit + integration + security + e2e quando aplicavel.

## Conexao com CI/CD
- Jobs descritos em `factory-workflow/cicd/templates.md`.
- Bloqueios definidos em `factory-workflow/cicd/gates.md`.
