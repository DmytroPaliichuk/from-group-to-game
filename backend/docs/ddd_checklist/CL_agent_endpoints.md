# CL: Vertex AI ADK Agent Endpoints

**Design:** `docs/ddd_design/DES_agent_endpoints.md`  
**Requirements:** `docs/ddd_requirement/REQ_agent_endpoints.md`

---

## Tasks

### Task 1 — Add dependency and implement agent endpoints `[completed]`

**Files:** `pyproject.toml`, `main.py`  
**Estimated diff:** ~80 lines

Add `google-cloud-aiplatform[agent_engines,adk]>=1.93.0` to `pyproject.toml` and run `uv sync`. Then extend `main.py` with:

1. Env var config block (reads `PROJECT_ID`, `LOCATION`, `AGENT_ENGINE_ID`; calls `sys.exit` if any are missing).
2. Vertex AI client init (`vertexai.init` + `agent_engines.get`), executed at module level after config validation.
3. Three Pydantic models: `SessionResponse`, `ChatRequest`, `ChatResponse`.
4. `POST /agent/sessions` endpoint — calls `_engine.create_session(user_id="")`, returns `{ "session_id": session["id"] }` with status 201; wraps errors in `HTTPException(502)`.
5. `POST /agent/chat` endpoint — calls `_engine.stream_query(...)`, aggregates text from `content.parts[].text` across all events, returns `{ "reply": "..." }` with status 200; wraps errors in `HTTPException(502)`.

> Verify the exact event shape from `stream_query` against the live SDK response and adjust the text-extraction path if it differs from `content.parts[].text`.

**Depends on:** nothing (first task)

---

### Task 2 — Add Agent API section to README `[completed]`

**Files:** `README.md`  
**Estimated diff:** ~40 lines

Add an **Agent API** section after the existing **API** section covering:

- Environment variables table (`PROJECT_ID`, `LOCATION`, `AGENT_ENGINE_ID`).
- `POST /agent/sessions` — description and `curl` example that captures the session ID into `$SESSION_ID`.
- `POST /agent/chat` — description and `curl` example that reuses `$SESSION_ID`.

**Depends on:** Task 1 (documents the endpoints added there)
