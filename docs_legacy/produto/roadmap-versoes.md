# Roadmap de Versões

## MVP (atual)
- Foco RJ, fluxo aluno → instrutor → pagamento (mock) → aula → review.
- Preparar virada para AbacatePay em dev mode: criar cobrança via `/billing/create`, salvar `billingId/paymentUrl`, mapear status → booking.
- Implementar webhook `/api/webhooks/abacatepay` para atualizar status (PAID/EXPIRED/CANCELLED) + reconciliação via `/billing/get`.

## Pós-MVP (próximas versões)
- Pagamento real AbacatePay (flag ligada), roles endurecidos, disponibilidade completa.

## Futuro (escala)
- App mobile, integrações oficiais, antifraude, chat/push.
