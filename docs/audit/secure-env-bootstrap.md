# Secure Environment Bootstrap (SEC-002)

Last updated: 2026-02-23

## Policy
- `.env.production` must never be tracked by git.
- Production secrets are sourced from secret manager or local secure file injection.
- Use `.env.production.example` only as a template.

## Local/Server Bootstrap
1. Copy template:
   ```bash
   cp .env.production.example .env.production
   ```
2. Fill secrets from secret manager.
3. Ensure secure auth mode:
   - `NODE_ENV=production`
   - `AUTH_MODE=oidc`
4. Start process:
   ```bash
   npm run start:prod
   ```

## Pre-commit Verification
```bash
git ls-files .env.production
```
Expected: no output.

## Runtime Security Guard
The server aborts startup when:
- `NODE_ENV=production` and `AUTH_MODE=local`

Temporary emergency override (diagnostics only):
- `ALLOW_INSECURE_LOCAL_AUTH_IN_PRODUCTION=true`
