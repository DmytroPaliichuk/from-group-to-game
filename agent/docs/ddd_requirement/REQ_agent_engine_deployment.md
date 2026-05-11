# REQ: Deploy us_olympics_agent to Vertex AI Agent Engine

## Summary

Add a new deployment script (`deploy_agent_engine.py`) that deploys the `us_olympics_agent` Google ADK agent to **Vertex AI Agent Engine**, bundling the pre-built ChromaDB vector index (`chroma_db/`) alongside the agent code so the RAG tool functions correctly in the Agent Engine runtime. The existing Cloud Run deployment (`deploy.py`) remains untouched.

---

## Actors

- **Developer** — runs the deployment script locally from the project root.

---

## Primary Flow

1. Developer ensures `us_olympics_agent/chroma_db/` contains a built ChromaDB index (produced by `build_index.py`).
2. Developer runs `python deploy_agent_engine.py` (or `uv run python deploy_agent_engine.py`).
3. Script reads `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` from `us_olympics_agent/.env`.
4. Script calls the Vertex AI Agent Engine API to create a new agent deployment, bundling `chroma_db/` via the `extra_packages` mechanism.
5. Script blocks and waits until the deployment operation completes (typically 5–10 minutes).
6. On success, script prints the Agent Engine resource name/ID (e.g. `projects/my-proj/locations/us-central1/reasoningEngines/12345`).
7. On failure, the Agent Engine error surfaces to the developer's terminal.

---

## Acceptance Criteria

- Running `python deploy_agent_engine.py` from the project root produces a new Agent Engine resource in the configured GCP project.
- The deployed agent can successfully answer queries that exercise the `search_athletes` RAG tool (i.e. ChromaDB data is accessible at runtime).
- The script reads `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` from `us_olympics_agent/.env`, consistent with `deploy.py`.
- The script blocks until the deployment is confirmed live before printing the resource name and exiting.
- Each run always creates a new Agent Engine deployment (no update-in-place logic).
- The existing `deploy.py` (Cloud Run) is not modified.

---

## Errors & Edge Cases

- **Missing `.env` or missing `GOOGLE_CLOUD_PROJECT`**: Script exits with a clear message (same pattern as `deploy.py`).
- **Agent Engine API failure** (e.g. quota exceeded, IAM permissions): Error propagates from the SDK to the developer's terminal without special handling.
- **Missing or empty `chroma_db/`**: No pre-flight check; if the data is missing the Agent Engine deployment may fail or the agent will error at query time — the developer is responsible for building the index first.

---

## Non-Functionals

- **No new dependencies**: Use packages already in `pyproject.toml` (`google-cloud-aiplatform` covers Agent Engine).
- **Deployment duration**: Acceptable for an interactive local script; no timeout required.
- **Security**: GCP credentials are resolved from the environment (ADC / `gcloud auth`), not hardcoded.

---

## Integrations & Data

| System | Role |
|--------|------|
| Vertex AI Agent Engine | Target runtime for the deployed agent |
| `us_olympics_agent/.env` | Source of `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION` |
| `us_olympics_agent/chroma_db/` | Pre-built ChromaDB vector index bundled as extra package |
| `google-cloud-aiplatform` SDK | Used to call `aiplatform.agent_engines.create()` |

The `chroma_db/` directory is read-only at deployment time; the agent does not write to it at runtime.

---

## Out of Scope

- Modifying or removing the Cloud Run deployment (`deploy.py`, `Dockerfile`).
- Idempotent update of an existing Agent Engine deployment.
- Automating `build_index.py` as part of the deployment script.
- Query/testing commands in the deployment script output.
- Pre-flight validation that `chroma_db/` is present or non-empty.
- CI/CD integration.
- Deleting or cleaning up old Agent Engine deployments.

---

## Open Questions / Assumptions

- **`extra_packages` path format**: Exactly how `chroma_db` must be specified (e.g. `"us_olympics_agent/chroma_db"` vs a `.tar.gz`) and whether `rag.py`'s `Path(__file__).parent / "chroma_db"` path resolution remains valid in the Agent Engine runtime is left for the design phase to resolve against the official docs.
- **Display name**: Assumed to be a constant like `"us-olympics-agent"` defined in the script; not user-configurable via `.env` unless design reveals a need.
