# Leaderboard deployment

The `/leaderboard` admin page reads and writes through `/api/v1/admin/leaderboard`. The existing Next.js rewrite forwards those authenticated requests to `API_BASE_URL`. The backend uses its existing `DATABASE_URL` for real events, participant college names, users and the points ledger. No database connection or credential belongs in this frontend.

## Backend release prerequisite

Deploy the backend leaderboard implementation and its migration before releasing this frontend. Backend `main` at `055e536` does not contain the leaderboard routes. On 27 October 2026, the OpenAPI document at `https://api.kratoseec.com/openapi.json` also contained no leaderboard endpoints.

The implementation is in backend branch `feat/admin-leaderboard` (commits `6a8ab95` and `d182414`, plus local uncommitted placement changes at inspection time). Review and include those placement changes: this frontend expects `breakdown[].placement` and award `placement` derived by the server.

1. Verify the actual deployed backend revision and PostgreSQL database selected by the Azure app's existing `DATABASE_URL`. Keep that existing database; do not create a demo database or copy SQLite data.
2. Back up the database and rehearse the upgrade against an isolated staging database. Migration `0020_college_leaderboard.py` adds colleges, the append-only points ledger, foreign keys and the unique live-award index. Reconcile its `0019` parent with the actual migration head before upgrading.
3. Apply the migration once per deployment; coordinate with the existing `scripts/start.sh`, which currently runs `alembic upgrade head` on startup. Do not point staging at production credentials.
4. Deploy `app.main:app` using the existing backend configuration. Never deploy `app.leaderboard.demo`: it uses SQLite and overrides authentication.
5. Check that `leaderboard-manage` is granted to intended roles. The migration seeds the role named `ADMIN`; super admin passes automatically, and event coordinators remain excluded by backend policy. Custom scorer roles need the permission explicitly.
6. Validate real JWT authorization and PostgreSQL reads/writes, concurrent saves, actor attribution, correction/void history and persistence across restarts before frontend release.

## Frontend configuration and checks

Set server-only `API_BASE_URL` to the deployed backend origin (the existing example is `https://api.kratoseec.com`) **before building**. Keep `GOOGLE_CLIENT_ID` aligned with backend OAuth settings and authorize the actual admin origin in Google. Do not set `DATABASE_URL`, signing secrets or Azure database passwords here.

```sh
npm ci
npm run test:leaderboard
npm run lint
npx tsc --noEmit --incremental false
npm run build
npm start
```

Verify the deployed rewrite reaches the intended API and preserves the bearer token. Sign in with a real permitted admin, import colleges from registrations, review spelling variants, and select a real event. Import is an explicit action; new participant profiles do not automatically create leaderboard colleges. Add approved results only. Scores replace the prior event/college award, including its note; they are not increments. Clear voids a score while retaining history.

Confirm another authorized browser receives saved standings within the next successful three-second polling cycle. Check ties, zero points, correction/void history, empty states and denied/expired sessions. Polling pauses when the document is hidden and stops on authorization failures. History is explicitly limited to the latest 500 matching awards because the backend does not expose pagination.

## Rollback

Redeploy the previous frontend build, and if needed the previous compatible backend artifact. Leave the additive leaderboard tables and award history intact. Do not use the migration downgrade as routine rollback: it drops the ledger and colleges. No Azure configuration, production schema, college import or score writes are performed by building or installing this frontend.

## Scope

This is the authenticated admin leaderboard. Public participant standings require a separate safe read-only backend route and public page. Production credentials were unavailable locally; browser verification uses isolated API fixtures and does not prove Azure connectivity or a successful production migration.
