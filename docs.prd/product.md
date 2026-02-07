# docs.md - HabilitFy

## Metadados
- Responsável: Guilherme / Equipe HabilitFy
- Data: 2026-02-05
- Versão: 2.0 (Produto Final)
- Status: **Em Produção** (Debug para lançamento segunda-feira)

## Visão
O **HabilitFy** é uma plataforma digital inovadora que conecta diretamente alunos e instrutores credenciados para aulas de direção, eliminando a dependência de autoescolas tradicionais.

Com foco em segurança, agilidade e flexibilidade, o app permite agendar, pagar, avaliar e gerenciar aulas de direção teórica e prática, com suporte a aluguel de veículo, validação documental rigorosa (KYC) e gestão financeira integrada.

O HabilitFy nasce alinhado à nova legislação brasileira, promovendo autonomia profissional para instrutores e facilidade total para alunos conquistarem sua CNH de forma moderna, econômica e 100% digital.

### Não-Objetivos
- Gestão de autoescolas (CFC).
- Educação à distância (EAD).

## Escopo
- **Dentro**: Agendar, remarcar, cancelar aulas; Pagamento via Pix/Cartão (AbacatePay); Avaliação de instrutores; KYC completo; Painel Admin; **Todas as categorias de habilitação (A, B, C, D, E)**.
- **Fora**: Integração direta com DETRAN (futuro).
- **Restrições**: O web app roda no Brasil inteiro. **Produto final, não é MVP.**

---

## Funcionalidades Implementadas

### Autenticação e Usuários
- [x] Login local (email/senha)
- [x] Login via Google OAuth
- [x] Verificação de email (token)
- [x] Cadastro de Aluno (wizard multi-etapas)
- [x] Cadastro de Instrutor (wizard multi-etapas com KYC)
- [x] Roles: `student`, `instructor`, `admin`

### Instrutores
- [x] Perfil público do instrutor
- [x] Dashboard do Instrutor (gestão de aulas, agenda, saldo)
- [x] Definição de preço/hora e duração do slot
- [x] Cadastro de múltiplos veículos com fotos e documentos (CRLV, LAV)
- [x] Credencial de instrutor (upload de imagem)
- [x] Selfie para validação facial
- [x] Geolocalização (lat/lng, cidade, estado, bairro)
- [x] Áreas de atendimento (serviceAreas)
- [x] Chave Pix para recebimento
- [x] Status de aprovação (`pending`, `approved`, `rejected`)
- [x] Rating e contagem de avaliações

### Alunos
- [x] Dashboard do Aluno
- [x] Busca de instrutores por mapa (MapPage com geolocalização)
- [x] Visualização de perfil de instrutor
- [x] Agendamento de aulas (Booking)
- [x] Opção de aluguel de veículo
- [x] Checkout com pagamento

### Agendamento (Bookings)
- [x] Status: `pending`, `confirmed`, `paid`, `completed`, `cancelled`
- [x] Código de início/fim de aula (startCode/endCode)
- [x] Timestamps: startedAt, completedAt, cancelledAt
- [x] Motivo de cancelamento e quem cancelou
- [x] Endereço de encontro e notas do aluno

### Pagamentos
- [x] Integração AbacatePay (API + Webhook)
- [x] Pix e Cartão
- [x] Modo dev/produção configurável
- [x] Transações: `booking`, `withdrawal`, `refund`, `commission`, `affiliate`, `coupon`
- [x] Status: `pending`, `paid`, `processing`, `refunded`, `cancelled`, `failed`

### Financeiro (Carteira)
- [x] Wallet por usuário (saldo em BRL)
- [x] Histórico de entradas (WalletEntries): `credit`, `debit`, `refund`, `withdrawal`, `adjustment`
- [x] Solicitação de saque (Withdrawals)
- [x] Status de saque: `pending`, `approved`, `rejected`, `processed`

### Avaliações (Reviews)
- [x] Avaliação por booking (nota + comentário)
- [x] Rating calculado por média ponderada
- [x] Contagem de reviews no perfil do instrutor

### Disputas
- [x] Abertura de disputa por aluno/instrutor
- [x] Status: `open`, `in_review`, `resolved`
- [x] Resolução: `refund_student`, `release_instructor`, `split`

### Suporte
- [x] Tickets de suporte (subject, message, attachments)
- [x] Status: `open`, `in_progress`, `resolved`, `closed`

### Disponibilidade
- [x] Agenda semanal por instrutor (dayOfWeek, startTime, endTime)

### Mensagens
- [x] Chat interno entre aluno e instrutor (por booking)
- [x] Status de leitura

### Painel Admin
- [x] Aprovação/rejeição de instrutores (KYC)
- [x] Aprovação/rejeição de veículos
- [x] Gestão de usuários
- [x] Gestão de bookings
- [x] Gestão de transações e saques
- [x] Configurações da plataforma (taxas, comissões)
- [x] Gestão de integrações (payment gateways, APIs)
- [x] Gestão de disputas
- [x] Tickets de suporte

### Integrações
- [x] Payment Gateways configuráveis
- [x] Sistema de integrações genéricas (slug, category, fields, status, environment)

---

## Stakeholders e Jornadas

### Personas
- **Aluno**: Busca instrutor, agenda aula, paga, avalia.
- **Instrutor**: Cadastra-se com KYC, define disponibilidade, recebe alunos, recebe pagamento.
- **Administrador**: Aprova instrutores/veículos, gerencia plataforma, resolve disputas.

### Jornada do Aluno
1. Cadastro (wizard multi-etapas ou Google OAuth)
2. Buscar instrutor no mapa
3. Ver perfil e disponibilidade
4. Agendar aula
5. Pagar (Pix/Cartão)
6. Confirmar início/fim com códigos
7. Avaliar instrutor

### Jornada do Instrutor
1. Cadastro (wizard com KYC: documentos, selfie, veículo)
2. Aguardar aprovação do Admin
3. Configurar disponibilidade e preço
4. Receber agendamentos
5. Realizar aulas e confirmar códigos
6. Solicitar saque do saldo

---

## Regras de Negócio
- **RN-001 (Acesso e Papéis)**: Roles distintos (Aluno, Instrutor, Admin) com permissões separadas.
- **RN-002 (Instrutores)**: Só aparecem para alunos após aprovação do Admin (KYC completo).
- **RN-003 (Booking)**: Aula confirmada apenas após status `paid`. Split automático de comissão.
- **RN-004 (Avaliações)**: Só permitida após aula concluída (completedAt preenchido).
- **RN-005 (LGPD)**: Coleta mínima de dados. Consentimento explícito em cadastros.
- **RN-006 (Cancelamento)**: Política de taxas conforme configuração do Admin (cancellationFeePercent).
- **RN-007 (Veículos)**: Múltiplos veículos por instrutor, cada um com aprovação independente.

---

## Entidades (Banco de Dados - MySQL)

| Entidade | Descrição |
|----------|-----------|
| `users` | Usuários (aluno, instrutor, admin) |
| `instructors` | Perfil de instrutor (veículo principal, KYC, rating) |
| `vehicles` | Veículos adicionais dos instrutores |
| `bookings` | Agendamentos de aulas |
| `reviews` | Avaliações de alunos para instrutores |
| `availability` | Disponibilidade semanal dos instrutores |
| `transactions` | Transações financeiras |
| `wallets` | Carteiras de usuários |
| `walletEntries` | Histórico de movimentações |
| `withdrawals` | Solicitações de saque |
| `disputes` | Disputas entre aluno/instrutor |
| `messages` | Chat interno |
| `supportTickets` | Tickets de suporte |
| `integrations` | Integrações externas (gateways, APIs) |
| `adminSettings` | Configurações da plataforma |
| `paymentGateways` | Gateways de pagamento |

---

## Stack Tecnológica
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Drizzle ORM
- **Database**: MySQL (Neon/Hostinger)
- **Auth**: Passport.js (Local + Google OAuth)
- **Pagamento**: AbacatePay (Pix + Cartão)
- **Infra**: Hostinger (Node.js App), Neon (DB)
