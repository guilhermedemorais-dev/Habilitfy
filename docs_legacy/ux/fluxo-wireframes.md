# Fluxo – Wireframes e Navegação de Telas

## 1. Estrutura Geral

- **Home/Landing**
  - Botão “Encontrar Instrutor Agora” (leva ao mapa/filtro)
  - Botão “Sou Instrutor” (leva ao login/cadastro instrutor)
  - Login global

---

## 2. Telas Principais e Navegação

### 2.1 Mapa / Descoberta

- [Home] → [Mapa/Listagem de Instrutores]
  - Filtro avançado (modal ou lateral)
  - Pins no mapa (clicáveis, levam ao perfil do instrutor)
  - Alternância lista/mapa
  - “Ver Perfil” → [Perfil Instrutor]

---

### 2.2 Cadastro/Onboarding

- [Login Global]
  - [Botão Cadastrar Aluno] → [Wizard Cadastro Aluno]
  - [Botão Cadastrar Instrutor] → [Wizard Cadastro Instrutor]
  - [Recuperação de senha]
  - [Política de privacidade/termos]

---

### 2.3 Dashboards

- [Dashboard Aluno]
  - Editar perfil
  - Histórico de aulas (cards/lista/calendário)
  - Carteira (saldo, extrato, sacar)
  - Guia do aluno (FAQ, materiais)
  - Avaliação de instrutores
  - Notificações
  - Suporte/chat

- [Dashboard Instrutor]
  - Serviços cadastrados
  - Veículos cadastrados
  - Histórico de aulas (cards/lista/calendário)
  - Carteira/recebíveis (saldo, extrato, sacar)
  - Chat com aluno
  - Notificações
  - Suporte

- [Dashboard Admin]
  - Mapa de usuários
  - Lista e triagem de instrutores (pendentes/aprovados)
  - KYC (pendentes, aprovados, rejeitados)
  - Financeiro/pagamentos/saques
  - Disputas e reclamações
  - Configurações (comissão, branding, hooks)
  - CMS/Conteúdo
  - Logs/auditoria
  - Notificações/broadcast
  - Relatórios

---

## 3. Telas Específicas

- [Perfil do Instrutor]
  - Dados, reviews, horários, veículos, botão de agendar aula

- [Agendamento de Aula]
  - Seleção de serviço, horário, veículo
  - Confirmação, pagamento, geração de QR/Check-in/Check-out

- [Painel de Saques]
  - Solicitação, status, histórico, dados Pix

- [Disputas/Reclamações]
  - Abertura, chat, upload de evidências, status, decisão

- [Afiliados/Cupons]
  - Geração de link, histórico, saldo, solicitação de saque

- [CMS/Admin de Conteúdo]
  - Banners, guias, políticas, FAQ, uploads

---

## 4. Navegação e Retornos

- Menu lateral persistente para alunos, instrutores, admin (cada um com itens relevantes ao seu perfil)
- Botões de retorno claros em todas telas, confirmação ao sair de processos com dados não salvos
- Páginas de erro, loading, feedback visual em todas ações críticas

---

## 5. Observações

- Telas pensadas para responsividade total (mobile-first)
- Navegação otimizada para fluxo rápido (mínimos cliques até objetivo)
- Áreas editáveis pelo admin via CMS, sem depender de dev para conteúdo

---

