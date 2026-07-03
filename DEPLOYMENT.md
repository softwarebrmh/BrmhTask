# Deployment

Frontend on **Vercel**. Backend + Postgres on **Railway** _or_ **Render** — pick one (both documented below).

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

## Backend — Render (alternative to Railway)

Uses Render's native Node runtime (not the Dockerfile).

1. Create a **PostgreSQL** instance first (Render dashboard → New → PostgreSQL). Copy its **Internal Database URL**.
2. New → **Web Service** → connect `softwarebrmh/BrmhTask`.
3. Configure the service:
   - **Root Directory**: `backend` (so commands run from there and only `backend/**` changes trigger auto-deploys)
   - **Runtime**: Node
   - **Build Command**:
     ```
     npm install --include=dev && npx prisma generate && npm run build
     ```
   - **Start Command**:
     ```
     npx prisma migrate deploy && npm run start
     ```
   `--include=dev` is required because the Prisma and Nest CLIs live in `devDependencies` (a plain install skips them when `NODE_ENV=production`). `prisma generate` rebuilds the client for Render's Linux target. `migrate deploy` applies migrations against the live DB on each deploy (idempotent).
4. Set **Environment Variables**:
   - `NODE_ENV=production`
   - `DATABASE_URL=<Render Postgres internal URL>`
   - `JWT_SECRET=<generate a long random secret>`
   - `JWT_EXPIRES_IN=7d`
   - `FRONTEND_URL=https://<your-vercel-app>.vercel.app` (comma-separate multiple origins)
   - `UPLOAD_DIR=uploads`
   - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` for email delivery
   - Render injects `PORT` automatically — don't set it; `main.ts` already reads `process.env.PORT`.
5. **Persistent uploads**: attachments write to local disk (`uploads/`), which is ephemeral on Render. Add a **Disk** mounted at `/opt/render/project/src/backend/uploads` so files survive redeploys (or move attachments to object storage later).
6. Deploy. Confirm health at `https://<service>.onrender.com/api/v1/health` and Swagger docs at `/api/docs`.

## Frontend — Vercel

1. New Vercel project → import the same GitHub repo.
2. Set **Root Directory** to `frontend` (Vercel auto-detects Next.js and reads `frontend/vercel.json`).
3. Set environment variables (Project Settings → Environment Variables):
   - `NEXT_PUBLIC_API_URL=https://<your-backend-host>/api/v1` (the Railway or Render URL)
   - `NEXT_PUBLIC_APP_NAME=BHRM Teams`
4. Deploy. `next.config.mjs` automatically allow-lists the backend host for `next/image` based on `NEXT_PUBLIC_API_URL`, so attachment thumbnails/avatars served from `/uploads` will load without extra config.

## After first deploy

- Update the backend's `FRONTEND_URL` to the real Vercel URL (and any preview domains) so CORS allows requests from it.
- Inspect/seed production data with `npx prisma studio` pointed at the production `DATABASE_URL` (Railway: `railway run`; Render: use the external database URL locally).
