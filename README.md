# From Group to Game

Interactive map of US Olympic and Paralympic athletes with an AI-powered chat assistant. See [info.md](info.md) for the full project and architecture description.

## Prerequisites

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud`) installed and authenticated
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- [Node.js](https://nodejs.org/) 20+
- A GCP project with Vertex AI API enabled
- A GCS bucket for agent staging (e.g. `gs://your-project-agent-bucket`)

---

## 1. Agent

The agent runs on **Vertex AI Agent Engine** (Reasoning Engine). It requires a pre-built ChromaDB vector index of athlete profiles.

### 1a. Build the RAG index (one-time)

```bash
cd agent
```

Create `us_olympics_agent/.env`:

```env
GOOGLE_GENAI_USE_VERTEXAI=1
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
STAGING_BUCKET=gs://your-agent-staging-bucket
```

Then build the index (requires Vertex AI credentials):

```bash
uv run python us_olympics_agent/build_index.py
```

This reads `us_olympics_agent/athletes_sub_prompt.txt`, embeds each athlete profile with `text-embedding-004`, and writes the index to `us_olympics_agent/chroma_db/`.

### 1b. Deploy to Vertex AI Agent Engine

```bash
make deploy-agent-engine
```

This runs `uv run adk deploy agent_engine` which packages the `us_olympics_agent/` directory (including `chroma_db/`) and deploys it to Vertex AI Agent Engine. Deployment takes 5–10 minutes.

When complete, note the **Reasoning Engine resource name** printed in the output — it looks like:

```
projects/PROJECT_ID/locations/LOCATION/reasoningEngines/AGENT_ENGINE_ID
```

You will need the `AGENT_ENGINE_ID` (the numeric part) to configure the backend.

---

## 2. Backend

The backend is a FastAPI app deployed to **Google Cloud Run**.

```bash
cd backend
```

Create `backend/.env`:

```env
PROJECT_ID=your-gcp-project-id
LOCATION=us-central1
AGENT_ENGINE_ID=<numeric-id-from-agent-deploy>
SERVICE_ACCOUNT=<your-compute-service-account>@developer.gserviceaccount.com
```

Deploy:

```bash
uv run python deploy.py
```

The script uses `gcloud run deploy --source .` (builds the container via Cloud Build) and sets the env vars from `.env`. Deployment takes a few minutes.

When complete, the backend URL is printed:

```
Deployed: https://from-group-to-game-backend-XXXXXXXXXXXX.us-central1.run.app
```

---

## 3. Frontend

The frontend is a Next.js app deployed to **Google Cloud Run** via Artifact Registry.

```bash
cd frontend
```

Set the required environment variables and run the deploy script:

```bash
PROJECT_ID=your-gcp-project-id \
API_URL=https://from-group-to-game-backend-XXXXXXXXXXXX.us-central1.run.app \
GEMINI_API_KEY=your-gemini-api-key \
bash deploy.sh
```

The script will:
1. Create an Artifact Registry Docker repository if it doesn't exist.
2. Build the Docker image via Cloud Build (with `API_URL` and `GEMINI_API_KEY` baked in as build args).
3. Deploy the image to Cloud Run.

The frontend URL is printed at the end.

**Optional env vars** (defaults shown):

| Variable | Default | Description |
|---|---|---|
| `REGION` | `us-central1` | GCP region |
| `SERVICE_NAME` | `from-group-to-game-frontend` | Cloud Run service name |
| `REPO_NAME` | `from-group-to-game` | Artifact Registry repo name |
| `IMAGE_NAME` | `frontend` | Docker image name |

---

## Local development

### Backend

```bash
cd backend
uv run uvicorn main:app --reload --port 8000
```

### Agent (local test via ADK)

```bash
cd agent
uv run adk web
```

### Frontend

```bash
cd frontend
echo "API_URL=http://localhost:8000" > .env.local
npm install
npm run dev
```
