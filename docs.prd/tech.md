# tech.md - HabilitFy

## Metadados
- Responsável: Equipe HabilitFy
- Data: 2026-02-05
- Versão: 1.0

## Stack
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui.
- **Backend**: Node.js, Express, Drizzle ORM.
- **Database**: PostgreSQL (Neon, hospedagem externa).
- **Auth**: Passport.js (Local + Google OAuth).
- **Infra/Deploy**: Hostinger (Node.js App), Neon (DB).
- **Observability**: Logs em `server.log` / `dev.log`.

## Módulos Principais
- **Auth**: Cadastro, login (local/Google), KYC, sessão.
- **Instrutores**: Perfil, veículos, documentos, status de aprovação.
- **Bookings**: Agendamento, status, pagamento.
- **Reviews**: Avaliações de instrutores por alunos.
- **Availability**: Horários disponíveis do instrutor.

## Integracoes
- **OIDC**: Replit (dev), futuro IdP.
- **Pagamento**: Mock atual; AbacatePay (futuro).
- **Outras (futuro)**: Senatran, CNH Digital.

## Deploy (Hostinger + Neon)
### Variáveis de Ambiente
- `DATABASE_URL=postgresql://user:pass@neon-host/db?sslmode=require`
- `SESSION_SECRET`
- `ISSUER_URL`
- `ABACATEPAY_API_KEY`, `ABACATEPAY_WEBHOOK_SECRET`, `ABACATEPAY_DEV_MODE`

### Passos
1. `npm install`
2. `DATABASE_URL=<neon-url> npm run db:push`
3. `npm run build`
4. Git deploy (ou upload) + configurar envs no painel Hostinger.
5. Configurar webhook AbacatePay: `https://api.seu-dominio.com/api/webhooks/abacatepay`.
