# Patterns

## Padroes reutilizaveis
- Formularios
- Tabelas
- Modais
- Navegacao
- Empty states
- Erro
- Loading

## Quando usar
- Formularios: entrada de dados estruturados.
- Tabelas: comparacao de registros.
- Modais: confirmacoes criticas.
- Navegacao: fluxos com multiplas secoes.
- Empty/Error/Loading: estados de sistema.

## Anti-padroes
- Modais desnecessarios.
- Validacao agressiva em tempo real.
- Excesso de steps sem ganho de clareza.

## Relacao
- Acessibilidade: `factory-workflow/design-system/a11y.md`
- Componentes: `factory-workflow/design-system/components.md`

## Estados padrao
- Empty: mensagem clara e acao sugerida.
- Erro: causa e proximo passo.
- Loading: indicador visivel e cancelamento quando aplicavel.
