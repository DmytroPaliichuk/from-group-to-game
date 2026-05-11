# CL: Frontend Cloud Run Deployment

Design doc: `docs/ddd_design/DES_frontend_cloud_run_deploy.md`

---

## Tasks

### Task 1 — Docker build infrastructure `completed`

**Files:** `frontend/next.config.ts` (modify), `frontend/Dockerfile` (create), `frontend/.dockerignore` (create)

**What:**
- Add `output: 'standalone'` to `next.config.ts` so Next.js emits a self-contained server bundle into `.next/standalone`.
- Create a three-stage `Dockerfile` (`deps` → `builder` → `runner`) on `node:22-alpine` that produces a minimal image running `node server.js` on port 3000 as a non-root user.
- Create `.dockerignore` excluding `node_modules`, `.next`, `.env*.local`, and `.git` to keep Cloud Build submit times fast.

**Depends on:** nothing

---

### Task 2 — Deployment shell script `completed`

**Files:** `frontend/deploy.sh` (create)

**What:**
- Create `frontend/deploy.sh` (`chmod +x`) with `set -euo pipefail`.
- Config block reads six env vars with documented defaults (`PROJECT_ID` required, rest have sensible defaults including `REGION=us-central1`).
- Prerequisite checks: `gcloud` in PATH, `PROJECT_ID` set, active gcloud auth account — each emits a specific error message and exits 1 on failure.
- `gcloud builds submit . --project="$PROJECT_ID" --tag="$IMAGE"` to build and push to Artifact Registry.
- `gcloud run deploy` with `--allow-unauthenticated`, `--port=3000`, and `--set-env-vars="API_URL=${API_URL}"`.
- Prints the deployed service URL via `gcloud run services describe … --format="value(status.url)"`.

**Depends on:** Task 1 (script references the image produced by the Dockerfile)
