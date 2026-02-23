# Sprint 0 - Credential Rotation Runbook (SEC-001)

Last updated: 2026-02-23

## Objective
Rotate all credentials previously exposed in repository history and invalidate old values.

## Scope
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- Database credentials (`DATABASE_URL`, `DB_*`)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- Any payment/webhook secret (if present in runtime)

## Preconditions
- Maintenance window approved.
- Backup/snapshot completed.
- Rollback owner assigned.
- New secrets already created in secret manager.

## Rotation Steps
1. Create new credentials in each provider console.
2. Update production secret manager with new values.
3. Deploy application with new secrets.
4. Validate health endpoints and authentication flow.
5. Invalidate/revoke old credentials in providers.
6. Confirm old credentials fail (negative test).
7. Record evidence (timestamp, operator, provider, revocation result).

## Validation Checklist
- [ ] App boot succeeds with new credentials.
- [ ] Login flow works (Google OAuth + session).
- [ ] DB connection works.
- [ ] AI integrations work.
- [ ] Old credentials rejected by provider.

## Rollback Plan
1. Re-apply previous known-good secret set from secret manager version history.
2. Redeploy last stable release.
3. Validate login, DB, and core API health.
4. Open incident if rollback exceeds 15 minutes.

## Evidence Template
- Date/time:
- Operator:
- Environment:
- Secret rotated:
- Old credential revoked (yes/no):
- Validation command/result:
- Notes:
