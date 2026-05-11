# DES: Frontend Cloud Run Deployment

## Overview

Three files implement the deployment pipeline:

1. **`frontend/next.config.ts`** — add `output: 'standalone'` (one-line change)
2. **`frontend/Dockerfile`** — three-stage build producing a minimal standalone image
3. **`frontend/.dockerignore`** — prevents heavy directories from being sent to Cloud Build
4. **`frontend/deploy.sh`** — shell script that validates prerequisites, builds via Cloud Build, and deploys to Cloud Run

`API_URL` is injected at Cloud Run deploy time as an environment variable (not a Docker build-arg) because `page.tsx` is an async server component that reads `process.env.API_URL` at request time, not build time.

---

## Architecture

```
Developer
    │
    └─ ./deploy.sh
          │
          ├─ 1. Prerequisite checks
          │       gcloud present, PROJECT_ID set, account active
          │
          ├─ 2. gcloud builds submit . --tag $IMAGE
          │       Cloud Build pulls frontend/ source
          │       → docker build (3 stages)
          │       → pushes image to Artifact Registry
          │
          └─ 3. gcloud run deploy --set-env-vars API_URL=...
                  Cloud Run pulls image from Artifact Registry
                  → running service with API_URL injected at runtime
                  → prints service URL
```

---

## File Designs

### `frontend/next.config.ts` (change)

Add `output: 'standalone'` to the existing config object. This tells Next.js to copy only the files required to run the app into `.next/standalone`, enabling the slim Dockerfile runtime stage.

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};
```

---

### `frontend/Dockerfile`

Three stages on `node:22-alpine`.

```
Stage 1 (deps)     — npm ci, produces node_modules
Stage 2 (builder)  — copies node_modules + source, runs npm run build
Stage 3 (runner)   — copies .next/standalone + public + .next/static only
                     runs as non-root user `nextjs`
                     CMD: node server.js on port 3000
```

**Stage 1 — deps**
```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
```

**Stage 2 — builder**
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
```

**Stage 3 — runner**
```dockerfile
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

`NEXT_TELEMETRY_DISABLED=1` suppresses Next.js build-time telemetry pings. `server.js` is the entry point produced by Next.js standalone output.

---

### `frontend/.dockerignore`

Prevents `node_modules` and `.next` from being uploaded to Cloud Build (the build context), keeping submit time fast.

```
node_modules
.next
.env*.local
.git
```

---

### `frontend/deploy.sh`

```
#!/usr/bin/env bash
set -euo pipefail

┌─ Config block ────────────────────────────────────────────────────┐
│  PROJECT_ID   — required, no default                              │
│  REGION       — default: us-central1                              │
│  SERVICE_NAME — default: from-group-to-game-frontend              │
│  REPO_NAME    — default: from-group-to-game                       │
│  IMAGE_NAME   — default: frontend                                 │
│  API_URL      — default: production backend URL                   │
└───────────────────────────────────────────────────────────────────┘

IMAGE = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

Prerequisite checks:
  1. command -v gcloud                   → error + exit 1 if missing
  2. [ -z "$PROJECT_ID" ]               → error + exit 1 if unset
  3. gcloud auth list --filter=ACTIVE   → error + exit 1 if no account

Build:
  gcloud builds submit . \
    --project="$PROJECT_ID"  \
    --tag="$IMAGE"

Deploy:
  gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE"                  \
    --region="$REGION"                \
    --project="$PROJECT_ID"           \
    --port=3000                       \
    --allow-unauthenticated           \
    --set-env-vars="API_URL=${API_URL}"

Print URL:
  gcloud run services describe "$SERVICE_NAME" \
    --region="$REGION" --project="$PROJECT_ID" \
    --format="value(status.url)"
```

`set -euo pipefail` ensures any failed command aborts the script and that unset variables are caught automatically.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Next.js output | `standalone` | Eliminates `node_modules` from the runtime image; aligns with Cloud Run best practices |
| Base image | `node:22-alpine` | Smallest footprint; LTS support until 2027 |
| Image tagging | `latest` only | Sufficient for a solo deploy workflow; avoids Artifact Registry bloat |
| `API_URL` injection | Cloud Run env var (`--set-env-vars`) | `page.tsx` is a server component — env vars are read at request time, not build time. No `cloudbuild.yaml` needed. |
| Cloud Run resources | Cloud Run defaults | No load data yet; scale-to-zero keeps cost at zero when idle |
| Script location | `frontend/deploy.sh` | Lives next to the Dockerfile it depends on |

---

## Testing

Run with a valid `PROJECT_ID` and `gcloud auth` active. Verify:
- Script exits with a clear error message if `PROJECT_ID` is unset.
- `gcloud builds submit` completes without error.
- The printed service URL loads the app in a browser.
- `process.env.API_URL` resolves correctly (check Network tab — requests to backend should succeed).
