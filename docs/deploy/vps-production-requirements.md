# HabilitFy: requisitos de produção e preparo do VPS

Este projeto sobe como um único processo Node.js que serve API, frontend compilado e arquivos de upload. O banco real do projeto é MySQL, não Postgres.

## Stack real de produção

- Node.js 20 LTS
- npm
- MySQL 8.x
- Nginx como proxy reverso
- Redis 7 opcional
- Linux com systemd

## O que o VPS precisa ter

- Usuário de sistema para rodar a app, ex.: `habilitfy`
- Diretório da aplicação, ex.: `/var/www/habilitfy`
- Node.js 20 e npm instalados
- Nginx instalado e habilitado
- MySQL 8 instalado localmente ou acesso a um MySQL externo
- Portas `80` e `443` públicas
- Porta `5000` liberada apenas localmente ou no firewall privado

## Estrutura esperada no servidor

- Código do projeto em `/var/www/habilitfy`
- Arquivo `/var/www/habilitfy/.env.production`
- Diretório persistente `/var/www/habilitfy/uploads`
- Build em `/var/www/habilitfy/dist/index.cjs` e `/var/www/habilitfy/dist/public`

## Variáveis obrigatórias

- `NODE_ENV=production`
- `PORT=5000`
- `HOST=0.0.0.0`
- `BASE_URL=https://seu-dominio.com`
- `DATABASE_URL=mysql://USER:SENHA@HOST:3306/habilitfy`
- `DB_HOST=HOST`
- `DB_PORT=3306`
- `DB_USER=USER`
- `DB_PASSWORD=SENHA`
- `DB_NAME=habilitfy`
- `SESSION_SECRET=<segredo forte>`
- `SESSION_COOKIE_SECURE=true`
- `AUTH_MODE=oidc`

## Variáveis por funcionalidade

- Google OAuth:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_CALLBACK_URL=https://seu-dominio.com/api/auth/google/callback`
- Pagamentos AbacatePay:
  - `ABACATEPAY_API_KEY`
  - `ABACATEPAY_WEBHOOK_SECRET`
  - `ABACATEPAY_BASE_URL=https://api.abacatepay.com`
  - `ABACATEPAY_DEV_MODE=false`
- Pagamentos Stripe:
  - `STRIPE_API_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- IA:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL=gpt-4o-mini`
  - `ANTHROPIC_API_KEY`
- E-mail:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_SECURE`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`
- Opcional:
  - `REDIS_URL=redis://127.0.0.1:6379`
  - `OWNER_MASTER_EMAIL=owner@dominio.com`

## Requisitos de banco

- Charset `utf8mb4`
- Banco MySQL disponível antes do primeiro start
- Tabela `sessions` precisa existir; o schema do projeto já cobre isso

Bootstrap recomendado:

```bash
cd /var/www/habilitfy
cp .env.production.example .env.production
npm ci
npm run build
DATABASE_URL='mysql://USER:SENHA@HOST:3306/habilitfy' npm run db:push
mkdir -p uploads/kyc
```

Alternativa de schema manual:

```bash
mysql -u USER -p habilitfy < migrations/mysql-schema.sql
```

## Comando real de start

Use:

```bash
npm start
```

`npm start` chama `server.cjs`, que carrega `.env.production` e sobe o bundle `dist/index.cjs`.

## Exemplo de unit systemd

```ini
[Unit]
Description=HabilitFy
After=network.target mysql.service

[Service]
Type=simple
User=habilitfy
Group=habilitfy
WorkingDirectory=/var/www/habilitfy
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

## Exemplo de proxy Nginx

Esse app usa sessão, OAuth callback e WebSocket. Preserve headers e upgrade:

```nginx
server {
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Persistência e storage

- `uploads/` precisa persistir entre deploys
- Se usar Docker, monte volume em `/app/uploads`
- Não limpe `uploads/` no pipeline

## Checklist antes de abrir produção

- `curl http://127.0.0.1:5000/api/health` responde `200`
- Login Google configurado com callback HTTPS correta
- `AUTH_MODE` não está como `local`
- `SESSION_SECRET` é forte e único
- Banco e usuário MySQL existem
- `uploads/` existe e tem permissão de escrita
- DNS aponta para o VPS
- Certificado TLS está ativo
- Webhook do AbacatePay aponta para `/api/webhooks/abacatepay`

## Prompt pronto para usar no Codex do VPS

Use este prompt no Codex CLI rodando dentro do VPS:

```text
Quero preparar este projeto HabilitFy para produção neste VPS.

Objetivo:
- validar dependências do sistema
- instalar o que faltar
- configurar Node 20, Nginx e MySQL se necessário
- criar o arquivo .env.production sem commitar segredos
- preparar diretório uploads com persistência
- instalar dependências do projeto
- gerar build com npm run build
- aplicar schema MySQL com npm run db:push
- configurar serviço systemd para rodar npm start
- configurar Nginx apontando para localhost:5000 com suporte a WebSocket
- validar /api/health localmente

Regras do projeto:
- banco é MySQL
- start real é npm start
- build real gera dist/index.cjs e dist/public
- frontend é servido pelo próprio Express
- AUTH_MODE de produção deve ser oidc
- uploads ficam em /var/www/habilitfy/uploads

Antes de alterar qualquer arquivo sensível, me mostre um plano curto e a lista de variáveis que você espera receber para produção.
```
