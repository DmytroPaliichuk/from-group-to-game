# REQ: Cloud Run Deployment Script

## Summary

A Python script that deploys the `from-group-to-game` FastAPI backend to Google Cloud Run with full public availability. The script reads configuration from the local `.env` file, invokes `gcloud run deploy --source .` via subprocess, and prints the deployed service URL on success.

---

## Actors

| Actor | Role |
|---|---|
| Developer | Runs the script locally to deploy the backend |
| End user / frontend | Calls the public Cloud Run endpoints after deploy |

---

## Primary Flow (Happy Path)

1. Developer runs `python deploy.py` from the `backend/` directory.
2. Script loads `PROJECT_ID`, `LOCATION`, and `AGENT_ENGINE_ID` from the local `.env` file.
3. Script validates that all three variables are present; aborts with a clear error message if any are missing.
4. Script checks that the `gcloud` CLI is available on `PATH`; aborts with a clear message if not.
5. Script invokes `gcloud run deploy from-group-to-game-backend` with:
   - `--source .` (Cloud Run builds the image via Buildpacks — no local Docker required)
   - `--region us-central1`
   - `--allow-unauthenticated` (public access)
   - `--set-env-vars` carrying all three required env vars
   - No explicit `--cpu` or `--memory` flags (Cloud Run defaults: 1 CPU, 512 MB RAM)
   - No explicit `--service-account` flag (defaults to the project's default Compute SA)
6. The `gcloud` process streams its output to the developer's terminal in real time.
7. On success, script extracts and prints the deployed service URL.

---

## Acceptance Criteria

- Running `python deploy.py` from `backend/` results in a live Cloud Run service reachable at a public HTTPS URL.
- All three endpoints (`GET /athletes/hometowns`, `POST /agent/sessions`, `POST /agent/chat`) respond correctly from the deployed URL.
- The script exits non-zero and prints a human-readable error message for each of the following failure cases:
  - Missing env var(s) in `.env`
  - `gcloud` CLI not found on `PATH`
  - `gcloud run deploy` returns a non-zero exit code
- The script does **not** require local Docker to be installed.
- Deployed service CORS policy allows all origins (`*`) so any frontend or HTTP client can call the API.

---

## Errors and Edge Cases

| Scenario | Expected behavior |
|---|---|
| `.env` file not found | Script prints a clear error (`".env not found in backend/"`), exits non-zero |
| One or more env vars missing from `.env` | Script prints which vars are missing, exits non-zero |
| `gcloud` not on PATH | Script prints `"gcloud CLI not found — install the Google Cloud SDK"`, exits non-zero |
| `gcloud run deploy` fails (e.g. auth, API not enabled) | gcloud output is visible in terminal; script exits with gcloud's exit code |
| Script run outside `backend/` | `.env` lookup uses the script's own directory, so location of invocation does not matter |

---

## Non-Functionals

- **No external Python dependencies beyond the standard library** — the script must be runnable with just `python deploy.py` without a `pip install` step.
- **Real-time output** — `gcloud` output must stream to the terminal as it runs, not buffer until completion.
- **Idempotent** — re-running the script updates the existing Cloud Run service rather than creating a duplicate.

---

## CORS Change Required in `main.py`

The current `main.py` hardcodes `allow_origins=["http://localhost:3000"]`. Before or as part of this deployment work, `main.py` must be updated to allow all origins (`"*"`) so the public Cloud Run URL is usable from any client. This change is in scope for this task.

---

## Configuration Summary

| Setting | Value |
|---|---|
| Service name | `from-group-to-game-backend` |
| Region | `us-central1` |
| Visibility | Public (`--allow-unauthenticated`) |
| Build method | `gcloud run deploy --source .` (Buildpacks) |
| CPU / RAM | Cloud Run default (1 vCPU, 512 MB) |
| Service account | Project default Compute SA |
| Env vars source | Local `.env` file |
| CORS | Allow all origins (`*`) |

---

## Out of Scope

- Custom Dockerfile or Docker-based build pipeline
- Google Secret Manager integration
- Dedicated / least-privilege service account creation
- Custom domain mapping
- Cloud Run min/max instance configuration
- CI/CD pipeline integration (GitHub Actions, Cloud Build triggers)
- Multi-environment (staging vs production) support
- Authentication / authorization on individual endpoints
- Monitoring, alerting, or logging configuration beyond Cloud Run defaults
