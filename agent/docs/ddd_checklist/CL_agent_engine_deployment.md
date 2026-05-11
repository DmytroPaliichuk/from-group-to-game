# CL: Deploy us_olympics_agent to Vertex AI Agent Engine

Design doc: `docs/ddd_design/DES_agent_engine_deployment.md`
Requirements: `docs/ddd_requirement/REQ_agent_engine_deployment.md`

---

## Tasks

### Task 1 — Patch `rag.py` + write `deploy_agent_engine.py`
**Status:** completed  
**Files:** `us_olympics_agent/rag.py` (modified), `deploy_agent_engine.py` (new)

**`rag.py` change (~3 lines):**  
Replace the hardcoded `_CHROMA_PATH` with an env-var-aware version so the path can be overridden at Agent Engine runtime without touching local dev behaviour:

```python
# Before
_CHROMA_PATH = Path(__file__).parent / "chroma_db"

# After
_CHROMA_PATH = Path(os.environ.get("CHROMA_DB_PATH", str(Path(__file__).parent / "chroma_db")))
```

`os` is already imported — no new imports needed.

**`deploy_agent_engine.py` (~70 lines):**  
New script at project root with the following structure:

- `load_env()` — reads `us_olympics_agent/.env` (same pattern as `deploy.py`)
- `main()`:
  1. Load env vars; exit with message if `GOOGLE_CLOUD_PROJECT` or `STAGING_BUCKET` is missing
  2. `vertexai.init(project, location, staging_bucket)`
  3. Wrap agent: `reasoning_engines.AdkApp(agent=root_agent, enable_tracing=True)`
  4. `agent_engines.create(agent_engine=app, requirements=REQUIREMENTS, extra_packages=["us_olympics_agent/chroma_db"], display_name=DISPLAY_NAME, env_vars={...})`
  5. Print `remote.resource_name`

Constants at top of file:
```python
DISPLAY_NAME = "us-olympics-agent"
CHROMA_RUNTIME_PATH = "/app/chroma_db"
REQUIREMENTS = [
    "google-cloud-aiplatform[adk,agent_engines]",
    "chromadb>=0.6.0",
]
```

env_vars passed to `agent_engines.create()`:
```python
{
    "CHROMA_DB_PATH": CHROMA_RUNTIME_PATH,
    "GOOGLE_CLOUD_PROJECT": project,
    "GOOGLE_CLOUD_LOCATION": location,
    "GOOGLE_GENAI_USE_VERTEXAI": "1",
}
```

> **Note:** If `env_vars` is not accepted by `agent_engines.create()` in the installed SDK version, remove that argument — the `CHROMA_RUNTIME_PATH` constant can be updated after verifying the actual working directory from Agent Engine logs.

---

## Pre-flight (manual — not a code task)

Before running the script, the developer must add to `us_olympics_agent/.env`:

```
STAGING_BUCKET=gs://your-existing-gcs-bucket
```

The script will exit with a clear message if this key is absent.
