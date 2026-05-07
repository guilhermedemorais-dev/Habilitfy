# Docker — Hardened Production Deploy

This guide describes how to deploy HabilitFy with the hardened
`docker-compose.yml` produced in the deploy-security pass. It assumes
you already have a server with Docker Engine + Compose v2.

> ⚠️ **Read this before first deploy.** Several defaults that previously
> existed in `docker-compose.yml` (weak passwords, public DB port) were
> removed. The compose file now refuses to start unless required secrets
> are provided.

---

## 1. Required environment variables

`docker-compose.yml` uses `${VAR:?...}` for the secrets below. `docker
compose up` will exit immediately if any are unset:

| Variable | Generate with |
|---|---|
| `DB_NAME` | choose a stable name |
| `DB_USER` | choose a non-`root` username |
| `DB_PASSWORD` | `openssl rand -base64 24 \| tr -d '/+='` |
| `DB_ROOT_PASSWORD` | `openssl rand -base64 24 \| tr -d '/+='` |
| `SESSION_SECRET` | `openssl rand -hex 64` |
| `BASE_URL` | e.g. `https://habilitfy.com.br` |
| `DOMAIN` | e.g. `habilitfy.com.br` |

Optional but recommended: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_CALLBACK_URL`, `OWNER_MASTER_EMAIL`, `ABACATEPAY_*`,
`STRIPE_*`, `SMTP_*`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`.

Use `.env.production.example` as a template and store the real file at
`/etc/habilitfy/.env.production` with `chmod 600`.

```bash
sudo install -m 600 -o root -g root .env.production /etc/habilitfy/.env.production
docker compose --env-file /etc/habilitfy/.env.production -f docker-compose.yml up -d
```

## 2. Network exposure

The hardened compose:

- **MySQL (`db`)**: no `ports:` mapping — reachable only over the
  internal `habilitfy-network`. To debug from the host, tunnel via SSH
  (`ssh -L 3306:127.0.0.1:3306 user@server` after enabling the
  loopback override commented in the file).
- **Redis (`redis`)**: same — internal-only.
- **App (`app`)**: bound to `127.0.0.1:5000`. Put a TLS-terminating
  reverse proxy (Caddy / Traefik / Nginx) in front. Do **not** expose
  the app directly on `0.0.0.0`.

If you really need to expose MySQL/Redis (e.g. managed admin tooling),
override locally in a `docker-compose.override.yml` that you do **not**
commit, and bind to `127.0.0.1` only.

## 3. Build hygiene

`.dockerignore` now excludes:

- All `.env*` files except the safe `*.example` templates
- `client_secret_*.json`, `*.pem`, `*.key`, `*.crt`, `*.p12`, `*.pfx`
- `backups/`, `uploads/`, `attached_assets/`, `*.sql`, `*.dump`, `*.bak`
- `logs/`, `*.log`, `dev.log`
- One-shot operational scripts (`seed-admin-prod.ts`,
  `diagnose-data.ts`, `fix-production-data.ts`, `test-db.cjs`,
  `test-prod-connection.ts`, `test-remote-server.cjs`)
- IDE / agent dirs (`.factory`, `.agents`, `.claude`, `.codex`)

Verify before deploy: `docker build . -t habilitfy-test && docker run
--rm habilitfy-test ls -la /app | grep -E '\.env|client_secret|backup'`
should return nothing.

## 4. Manual actions outside this commit

These items are **out of scope** for the deploy-security pass and must
be done by the operator on the provider side:

1. **Rotate the leaked production credentials.** The previous
   `DB_PASSWORD`, `SESSION_SECRET` and `GOOGLE_CLIENT_SECRET` exist in
   the git history (commits `b47b19a`, `153d32a`, `7f7167d` and others)
   and on the developer workstation. They must be rotated at the
   provider (Hostinger MySQL user, Google Cloud OAuth client) **before**
   the next deploy regardless of whether history is rewritten.
2. **Re-issue the OAuth client secret** in Google Cloud Console; delete
   the local `client_secret_*.json` from the project root.
3. **Decide on git history.** Either rewrite history with
   `git filter-repo` (preferred if the repo is shared) or accept that
   the rotated credentials make the leaked values worthless. Either way,
   never reintroduce real `.env*` files to the working tree.
4. **Generate fresh secrets** with the commands in §1 and load them via
   the env-file path in §1.
5. **Front the app with TLS** (Caddy is the simplest — it gets certs
   automatically). The compose file deliberately leaves TLS termination
   out so it does not assume a specific reverse proxy.

## 5. Local development

For local dev, use `docker-compose.dev.yml`. It:

- Keeps the well-known passwords (`habilitfy_dev`, `root_dev_password`)
  but binds **every** service port to `127.0.0.1` so it cannot be
  reached from the LAN.
- Includes Adminer (`127.0.0.1:5050`) and MailHog (`127.0.0.1:8025`)
  as developer conveniences.

The dev compose has a banner warning that it is **local-only** — never
start it on a VPS or any host with a public IP.
