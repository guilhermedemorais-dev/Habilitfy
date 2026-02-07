# Modulo: Billing

## Objetivo
- Gerenciar assinaturas, planos e faturamento do SaaS.

## Escopo
- Planos e precos
- Assinaturas e renovacoes
- Faturas e pagamentos
- Cancelamento e reativacao

## Fora de escopo
- Comissao de afiliados
- Contabilidade interna

## Personas e permissoes
- admin: gerencia planos e ve faturamento
- owner: aprova cancelamentos e descontos
- finance: exporta relatorios

## Paginas do modulo
- Planos: `factory-workflow/docs/projects/<PROJETO>/reference/modules/billing/pages/planos.md`
- Assinaturas: `factory-workflow/docs/projects/<PROJETO>/reference/modules/billing/pages/assinaturas.md`
- Faturas: `factory-workflow/docs/projects/<PROJETO>/reference/modules/billing/pages/faturas.md`

## Regras compartilhadas
- Precos com imposto devem seguir tabela fiscal ativa
- Cancelamento imediato desativa acesso em ate 5 minutos

## Dados compartilhados
- customer_id: identificador do cliente
- subscription_id: assinatura ativa
- invoice_id: fatura gerada

## Integracoes
- Stripe (pagamentos e webhooks)
- ERP interno (exportacao mensal)

## Eventos e telemetria
- billing.subscription.created
- billing.subscription.cancelled
- billing.invoice.paid

## Dependencias
- modulo de usuarios (customer_id)
- modulo de acesso (ativar/desativar acesso)

## Riscos e mitigacoes
- risco: falha em webhook de pagamento
  mitigacao: fila de retry + reconciliacao diaria

## QA e criterios de aceite
- pagamento aprovado cria assinatura ativa
- cancelamento imediato remove acesso
- fatura paga gera recibo
