# Deployment

Frontend on **Vercel**, backend + Postgres on **Railway**.

## Backend — Railway

1. New Railway project → **Deploy from GitHub repo** → select `softwarebrmh/BrmhTask`.
2. Set the service's **root directory** to `backend`. Railway will detect `railway.json` and build with the included `Dockerfile` (which runs `prisma migrate deploy` before starting).
3. Add a **Postgres** plugin to the project. Railway injects `DATABASE_URL` automatically — reference it in the backend service's variables as `${{Postgres.DATABASE_URL}}`.
4. Set backend service environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET=<generate a long random secret>`
   - `JWT_EXPIRES_IN=7d`
   - `FRONTEND_URL=https://<your-vercel-app>.vercel.app` (comma-separate multiple origins, e.g. add a preview URL too)
   - `UPLOAD_DIR=uploads`
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` for real email delivery
   - Railway sets `PORT` automatically — no need to set it manually.
5. **Persistent uploads**: attachments are written to local disk (`uploads/`), which is ephemeral on redeploy. Add a Railway **Volume** mounted at `/app/uploads` on the backend service so uploaded files survive deploys.
6. Deploy. Confirm health at `https://<service>.up.railway.app/api/v1/health` and Swagger docs at `/api/docs`.

## Frontend — Vercel

1. New Vercel project → import the same GitHub repo.
2. Set **Root Directory** to `frontend` (Vercel auto-detects Next.js and reads `frontend/vercel.json`).
3. Set environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_API_URL=https://<your-railway-service>.up.railway.app/api/v1`
   - `NEXT_PUBLIC_APP_NAME=BHRM Teams`
4. Deploy. `next.config.mjs` automatically allow-lists the Railway host for `next/image` based on `NEXT_PUBLIC_API_URL`, so attachment thumbnails/avatars served from `/uploads` will load without extra config.

## After first deploy

- Update the Railway backend's `FRONTEND_URL` to the real Vercel URL (and any preview domains) so CORS allows requests from it.
- Run `npx prisma studio` locally against the Railway `DATABASE_URL` (or `railway run`) if you need to inspect/seed production data.
