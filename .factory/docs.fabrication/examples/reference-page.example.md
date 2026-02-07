# Pagina: Assinaturas

## Objetivo
- Permitir que o admin veja e gerencie assinaturas ativas.

## Permissoes e acesso
- admin: leitura e alteracao
- finance: leitura

## Entrada de dados
- Campos/formularios:
  - status: ativo | cancelado | pendente
  - data_inicio: date
  - data_fim: date
- Query params:
  - customer_id: required

## Saidas
- UI:
  - lista de assinaturas com status, plano, valor
  - detalhamento da assinatura selecionada
- Eventos:
  - subscription_viewed
  - subscription_updated

## Estados da pagina
- carregando
- vazio
- erro
- sucesso

## Regras de negocio
- Apenas assinaturas do customer_id informado devem aparecer
- Alteracoes de plano exigem confirmacao do owner

## Validacoes
- customer_id obrigatorio
- data_fim >= data_inicio

## Fluxos
- Happy path:
  - admin busca cliente
  - sistema lista assinaturas
  - admin atualiza plano
  - sistema registra evento
- Edge cases:
  - cliente sem assinatura ativa
  - plano indisponivel

## Integracoes
- Stripe: leitura de assinatura e historico
- CRM: atualizacao de status

## Dados e contratos
- Subscription: id, plan_id, status, start_at, end_at

## Observabilidade
- Logs:
  - subscription.list
  - subscription.update
- Metrics:
  - subscription_update_latency_ms

## Acessibilidade
- foco visivel em botoes
- contraste minimo AA

## QA e criterios de aceite
- lista respeita filtros
- alteracao de plano exige aprovacao
- erros exibem mensagem clara
