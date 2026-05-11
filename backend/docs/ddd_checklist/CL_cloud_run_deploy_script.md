# CL: Cloud Run Deployment Script

**Design:** `docs/ddd_design/DES_cloud_run_deploy_script.md`
**Requirements:** `docs/ddd_requirement/REQ_cloud_run_deploy_script.md`

---

## Tasks

### Task 1 — CORS fix in `main.py` + create `deploy.py` · `completed`

**Files:** `backend/main.py` (edit), `backend/deploy.py` (new)

**Why combined:** The CORS edit is 1 line (below the 50-line merge threshold); it belongs with the deploy script since both changes together enable the public deployment.

**What to do:**

1. In `backend/main.py`, change:
   ```python
   allow_origins=["http://localhost:3000"],
   ```
   to:
   ```python
   allow_origins=["*"],
   ```

2. Create `backend/deploy.py` (stdlib only — no imports outside the standard library):

   **Constants:**
   ```python
   REQUIRED_VARS = ["PROJECT_ID", "LOCATION", "AGENT_ENGINE_ID"]
   SERVICE_NAME  = "from-group-to-game-backend"
   REGION        = "us-central1"
   SCRIPT_DIR    = Path(__file__).parent
   ```

   **`load_env(env_path)`** — exits if `.env` missing; skips blank/comment lines; splits on first `=` only (`str.partition`); returns `{key: value}`.

   **`check_gcloud()`** — uses `shutil.which("gcloud")`; exits with:
   `"Error: gcloud CLI not found — install the Google Cloud SDK and authenticate with \`gcloud auth login\`."`

   **`deploy(env_vars)`** — calls `subprocess.run` inheriting stdin/stdout/stderr (live streaming); command:
   ```
   gcloud run deploy from-group-to-game-backend
     --source <SCRIPT_DIR>
     --region us-central1
     --allow-unauthenticated
     --set-env-vars KEY=VAL,KEY=VAL,...
   ```
   Exits with gcloud's exit code on failure.

   **`get_service_url()`** — runs `gcloud run services describe from-group-to-game-backend --region us-central1 --format=value(status.url)` with `capture_output=True`; returns stripped stdout.

   **`main()`** — orchestrates: load env → validate missing vars → check gcloud → deploy → get URL → print `"Deployed: <url>"`.

**Acceptance check:**
- `python deploy.py` from any directory streams gcloud output live and prints the deployed URL on success.
- Script exits non-zero with a clear message for: missing `.env`, missing vars, gcloud not found, deploy failure.
- `GET /athletes/hometowns` responds from the Cloud Run URL.
- No `docker` or `pip install` required to run the script.
