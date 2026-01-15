# Seed Spec

Script: `npm run seed:auth` (usa `script/seed-auth-users.ts`). Requer `DATABASE_URL` e `SESSION_SECRET` configurados.

Usuários criados/atualizados:
- Admin: `admin@habilitfy.local` / `Admin123!`
- Aluno: `aluno@habilitfy.local` / `Aluno123!`
- Instrutor: `instrutor@habilitfy.local` / `Instrutor123!` (gera profile aprovado com preço/endereço fictícios)

Notas:
- Senhas são hasheadas via `hashPassword` antes de persistir.
- Seed é idempotente: atualiza se usuário já existir e reescreve dados principais.
- Sessão usa tabela `sessions`; certifique-se de ter rodado `npm run db:push` antes.
