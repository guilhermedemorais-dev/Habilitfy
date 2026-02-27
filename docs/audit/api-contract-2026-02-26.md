# API Contract Freeze - 2026-02-26

## Escopo congelado (Sprint 2)

### Auth
- `GET /api/auth/user`
  - Fonte única: `server/auth.ts`
  - Respostas:
    - `200` com usuário autenticado + `instructorProfile`
    - `401` não autenticado
    - `404` usuário inexistente

### Admin
- `GET /api/admin/instructors`
  - Fonte única: `server/domains/admin/routes.ts`
  - Query opcional: `status`
  - Resposta `200`: lista de instrutores com usuário sanitizado

- `GET /api/admin/users`
  - Fonte única: `server/domains/admin/routes.ts`
  - Query opcional: `role`
  - Resposta `200`: lista de usuários sanitizada

### Webhooks (pagamentos)
- `POST /api/webhooks/stripe`
  - Fonte única: `server/routes.ts`
  - Evento tratado: `checkout.session.completed`
  - Garantia de idempotência:
    - evento duplicado para mesmo `bookingId + session.id` retorna `200` com `{ received: true, idempotent: true }`
    - escrita financeira via `storage.upsertBookingTransaction(updatedBooking)`

## Observabilidade
- Logs de API não incluem payload de resposta bruto.
- Em produção, o logger registra apenas `responseSummary` (tipo, quantidade de chaves, tamanho).
