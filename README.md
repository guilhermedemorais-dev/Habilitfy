<p align="center">
  <img src="logo e cores/logo-habilitfy.png" alt="HabilitFy Logo" width="200"/>
</p>

<h1 align="center">HabilitFy</h1>

<p align="center">
  <strong>Plataforma completa para conexão entre instrutores de direção e alunos</strong>
</p>

<p align="center">
  <a href="#-sobre">Sobre</a> •
  <a href="#-funcionalidades">Funcionalidades</a> •
  <a href="#-tecnologias">Tecnologias</a> •
  <a href="#-instalação">Instalação</a> •
  <a href="#-uso">Uso</a> •
  <a href="#-deploy">Deploy</a> •
  <a href="#-licença">Licença</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen" alt="Node Version"/>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License"/>
  <img src="https://img.shields.io/badge/status-em%20desenvolvimento-yellow" alt="Status"/>
</p>

---

## 📋 Sobre

O **HabilitFy** é uma plataforma SaaS moderna que conecta **instrutores de direção** a **alunos** que desejam aprender a dirigir. A aplicação oferece um ecossistema completo para agendamento de aulas, gestão financeira, verificação KYC (Know Your Customer), pagamentos integrados e muito mais.

### 🎯 Público-Alvo

- **Instrutores de Autoescola**: Profissionais que desejam gerenciar seus horários, alunos e finanças de forma digital
- **Alunos**: Pessoas que buscam aulas de direção com flexibilidade de horários e pagamento online
- **Administradores**: Gestores da plataforma com acesso a métricas, aprovações e configurações

---

## ✨ Funcionalidades

### Para Alunos
- 📅 **Agendamento de Aulas** - Visualize disponibilidade e agende aulas com instrutores
- 💳 **Pagamento Online** - PIX e cartão de crédito via AbacatePay
- 📍 **Localização** - Encontre instrutores próximos com mapa interativo
- ⭐ **Avaliações** - Avalie instrutores após as aulas
- 💬 **Chat em Tempo Real** - Comunique-se diretamente com seu instrutor

### Para Instrutores
- 📊 **Dashboard Completo** - Visualize agendamentos, ganhos e métricas
- 🗓️ **Gestão de Agenda** - Configure disponibilidade e duração das aulas
- 💰 **Carteira Digital** - Acompanhe saldo e solicite saques
- 🚗 **Cadastro de Veículos** - Gerencie sua frota de veículos
- 🔐 **Códigos de Segurança** - Códigos QR para início e fim de aulas

### Para Administradores
- 👥 **Gestão de Usuários** - Aprove ou rejeite cadastros
- 🔍 **Verificação KYC** - Valide documentos e selfies com IA
- 💸 **Gestão Financeira** - Configure taxas, gateways e integrações
- 📈 **Relatórios** - Acompanhe métricas da plataforma
- ⚙️ **Configurações** - Gerencie integrações (AbacatePay, OpenAI)

---

## 🛠️ Tecnologias

### Frontend
- **React 18** - Biblioteca UI moderna
- **TypeScript** - Tipagem estática
- **Tailwind CSS 3** - Estilização utility-first
- **Vite 5** - Build tool ultrarrápida
- **React Query** - Gerenciamento de estado assíncrono
- **Wouter** - Roteamento leve
- **Framer Motion** - Animações fluidas
- **Radix UI** - Componentes acessíveis
- **Leaflet** - Mapas interativos
- **Recharts** - Gráficos e visualizações

### Backend
- **Node.js 22** - Runtime JavaScript
- **Express 4** - Framework web
- **MySQL 8+** - Banco de dados relacional
- **Drizzle ORM** - ORM type-safe
- **Passport.js** - Autenticação (Google OAuth, Local)
- **WebSocket** - Comunicação em tempo real

### Integrações
- **AbacatePay** - Gateway de pagamentos (PIX/Cartão)
- **OpenAI / Anthropic** - IA para assistente e KYC
- **Google OAuth 2.0** - Login social

### DevOps
- **Docker** - Containerização
- **Playwright** - Testes E2E
- **Vitest** - Testes unitários
- **ESBuild** - Bundling do servidor

---

## 📦 Instalação

### Pré-requisitos

- Node.js >= 22.x
- MySQL >= 8
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone https://github.com/guilhermedemorais-dev/Habilitfy.git
   cd Habilitfy
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas configurações:
   ```env
   DATABASE_URL=mysql://usuario:senha@localhost:3306/habilitfy
   SESSION_SECRET=sua-chave-secreta-aqui
   AUTH_MODE=local  # desenvolvimento
   ```

   Para produção, use um arquivo local **não versionado**:
   ```bash
   cp .env.production.example .env.production
   ```

4. **Execute as migrações do banco**
   ```bash
   npm run db:push
   ```

5. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```

6. **Acesse a aplicação**
   ```
   http://localhost:5000
   ```

---

## 🚀 Uso

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor em modo desenvolvimento |
| `npm run build` | Compila o projeto para produção |
| `npm run start` | Inicia o servidor em modo produção |
| `npm run check` | Verifica tipos TypeScript |
| `npm run db:push` | Aplica migrações no banco de dados |
| `npm run test` | Executa todos os testes |
| `npm run test:unit` | Executa apenas testes unitários |
| `npm run test:e2e` | Executa testes end-to-end |
| `npm run test:smoke:access:api` | Smoke de controle de acesso da API admin |
| `npm run test:smoke:access:ui` | Smoke de acesso da UI admin |
| `npm run verify` | Gate local: `check + test:unit + smokes de acesso` |

### Modo de Desenvolvimento Local

Para desenvolvimento sem configurar Google OAuth:

```env
AUTH_MODE=local
LOCAL_USER_ID=dev-admin
LOCAL_USER_EMAIL=admin@habilitfy.com
LOCAL_USER_ROLE=admin
```

---

## 🌐 Deploy

### Variáveis de Ambiente Obrigatórias

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL de conexão MySQL |
| `SESSION_SECRET` | Chave secreta para sessões |
| `NODE_ENV` | `production` para deploy |
| `AUTH_MODE` | `oidc` para produção ( `local` é bloqueado em produção ) |

### QA remoto (espelho)

Para auditoria de schema/DB em espelho remoto:

```bash
cp .env.qa-remote.example .env.qa-remote
npm run audit:schema:parity
```

### Variáveis Opcionais

| Variável | Descrição |
|----------|-----------|
| `GOOGLE_CLIENT_ID` | ID do cliente Google OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Secret do cliente Google OAuth 2.0 |
| `GOOGLE_CALLBACK_URL` | URL de callback (ex: https://site.com/api/auth/google/callback) |
| `ABACATEPAY_API_KEY` | Chave de API do AbacatePay |
| `OPENAI_API_KEY` | Chave de API da OpenAI |

### Deploy com Docker

```bash
docker-compose up -d
```

### Deploy na Hostinger / VPS

1. Configure as variáveis de ambiente no painel
2. Aponte para a branch `main`
3. Use a configuração predefinida **Express**
4. O build será executado automaticamente

---

## 📁 Estrutura do Projeto

```
habilitfy/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilitários
│   │   └── index.css       # Estilos globais
├── server/                 # Backend Express
│   ├── routes.ts           # Rotas da API
│   ├── auth.ts             # Autenticação
│   ├── storage.ts          # Camada de dados
│   ├── db.ts               # Conexão com banco
│   └── services/           # Serviços de negócio
├── shared/                 # Código compartilhado
│   └── schema.ts           # Schemas Drizzle/Zod
├── migrations/             # Migrações do banco
├── e2e/                    # Testes E2E
└── factory/                # Sistema de automação
```

---

## 🧪 Testes

### Executar Testes Unitários
```bash
npm run test:unit
```

### Executar Testes E2E
```bash
npm run test:e2e
```

### Modo Watch
```bash
npm run test:watch
```

---

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### Convenções de Commit

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Manutenção

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Contato

- **Website**: [habilitfy.com.br](https://habilitfy.com.br)
- **Email**: contato@habilitfy.com.br

---

<p align="center">
  Feito com ❤️ por <a href="https://github.com/guilhermedemorais-dev">Guilherme de Morais</a>
</p>
