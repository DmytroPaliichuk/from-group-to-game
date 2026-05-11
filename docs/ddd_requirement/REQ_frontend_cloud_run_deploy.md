# REQ: Frontend Cloud Run Deployment Script

## Overview

A shell script (and accompanying Dockerfile) that packages the Next.js 16 frontend into a Docker image, builds it remotely via Google Cloud Build, pushes it to Artifact Registry, and deploys it as a public Cloud Run service — matching the same GCP project and region (`us-central1`) used by the existing backend.

---

## Actors

- **Developer** — the person who runs `./deploy.sh` from their local machine to publish a new version of the frontend.

---

## Primary Flows

### Happy path

1. Developer sets any overrides as env vars (or relies on defaults) and runs `./deploy.sh`.
2. Script validates prerequisites (`gcloud` present, authenticated, required vars set).
3. Script submits the frontend directory to Cloud Build via `gcloud builds submit`.
4. Cloud Build builds the Docker image using the project's `Dockerfile`, injecting `API_URL` as a build argument, and pushes the image to Artifact Registry.
5. Script deploys the new image to Cloud Run with public (unauthenticated) access.
6. Script prints the live service URL when deployment succeeds.

---

## Acceptance Criteria

- Running `./deploy.sh` with no arguments and correct `gcloud` auth deploys the frontend successfully.
- The deployed service is publicly accessible (no auth required).
- The Next.js build inside the Docker image uses the production `API_URL` baked in at build time.
- If `gcloud` is not in `PATH`, the script exits immediately with a clear error message.
- If `gcloud auth` is not configured, the script exits immediately with a clear error message.
- The service URL is printed to stdout after a successful deploy.

---

## Configuration

The script reads the following environment variables, with fallback defaults:

| Variable       | Default                          | Purpose                                    |
|----------------|----------------------------------|--------------------------------------------|
| `PROJECT_ID`   | _(required, no default)_         | GCP project ID (e.g. `from-group-to-game`) |
| `REGION`       | `us-central1`                    | Cloud Run / Artifact Registry region       |
| `SERVICE_NAME` | `from-group-to-game-frontend`    | Cloud Run service name                     |
| `REPO_NAME`    | `from-group-to-game`             | Artifact Registry repository name          |
| `IMAGE_NAME`   | `frontend`                       | Image name within the repository           |
| `API_URL`      | _(current production backend URL)_ | Baked into the Next.js build via `--build-arg` |

`PROJECT_ID` has no default and the script must error if it is unset.

---

## Errors & Edge Cases

- **`gcloud` not found:** Script prints `"Error: gcloud is not installed or not in PATH."` and exits with code 1.
- **Not authenticated:** Script checks `gcloud auth list` for an active account; if none, prints `"Error: No active gcloud account. Run: gcloud auth login"` and exits.
- **`PROJECT_ID` unset:** Script prints `"Error: PROJECT_ID env var is required."` and exits.
- **Cloud Build failure:** `gcloud builds submit` exits non-zero; the script propagates the exit code and does not proceed to deploy.
- **Cloud Run deploy failure:** `gcloud run deploy` exits non-zero; script propagates the exit code.

---

## Non-Functionals

- **Idempotency:** Running the script multiple times must succeed; Cloud Run handles rolling updates.
- **No local Docker required:** The build step uses Cloud Build exclusively.
- **No secrets in script:** `API_URL` default may be hardcoded as the public backend URL (non-secret); sensitive secrets are out of scope.

---

## Integrations & Data

- **Google Cloud Build API** — used for remote image build.
- **Google Artifact Registry** — stores the built Docker image.
- **Google Cloud Run** — hosts the deployed frontend service.
- **Existing backend** — the production `API_URL` points to `https://from-group-to-game-backend-656681019973.us-central1.run.app`.

---

## Deliverables

Two files are in scope:

1. **`frontend/Dockerfile`** — multi-stage build: install deps → `npm run build` → minimal runtime stage running `npm start` on port 3000.
2. **`deploy.sh`** (at repo root or a `scripts/` directory) — the deployment shell script described above.

---

## Out of Scope

- CI/CD pipeline (GitHub Actions, Cloud Build triggers) — manual script only.
- Secrets management (Secret Manager integration).
- Custom domain / SSL certificate setup.
- Rollback automation.
- Multiple environments (staging vs. production) — single deploy target only.
- Any changes to the Next.js application code itself.
