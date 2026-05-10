# REQ: Vertex AI ADK Agent Endpoints

## Overview

Add two new REST endpoints to the existing FastAPI backend that proxy requests to a deployed Vertex AI ADK agent. Also document both endpoints with `curl` examples in the project README.

---

## Background

A Vertex AI ADK agent is already deployed. Its coordinates are configured via environment variables (see Configuration). The FastAPI backend currently has no agent integration; this work adds it.

---

## Actors

- **API caller** — any client (frontend, curl, external service) that wants to talk to the agent.
- **FastAPI backend** — proxies calls to Vertex AI on behalf of the caller.
- **Vertex AI ADK agent** — the deployed agent that handles natural-language queries.

---

## Endpoints

### 1. Create session

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/agent/sessions` |
| **Request body** | none |
| **Success response** | `201 Created` — `{ "session_id": "<string>" }` |

**Behavior:**  
Creates a new session on the Vertex AI ADK agent and returns the session ID to the caller. The backend does not store the session; the caller is responsible for persisting and supplying it in subsequent requests.

---

### 2. Send message

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/agent/chat` |
| **Request body** | `{ "session_id": "<string>", "message": "<string>" }` |
| **Success response** | `200 OK` — `{ "reply": "<string>" }` |

**Behavior:**  
Sends the caller's message to the agent under the given session, waits for the complete response, and returns it as a single JSON object. Streaming is not required.

---

## Configuration

The agent coordinates are read from environment variables at server startup. All three are required:

| Variable | Example value | Description |
|---|---|---|
| `PROJECT_ID` | `656681019973` | GCP project ID |
| `LOCATION` | `us-central1` | Vertex AI region |
| `AGENT_ENGINE_ID` | `1563888714499751936` | ADK agent engine ID |

If any variable is missing, the server should fail fast at startup with a clear error message (not at request time).

---

## Authentication

The backend authenticates to Vertex AI using **Application Default Credentials (ADC)** via the `google-auth` library. No explicit credential file is needed when running on GCP (Cloud Run, GCE, etc.). For local development, the developer must run `gcloud auth application-default login` beforehand.

The endpoints themselves are **unauthenticated** — no API key or token is required from the caller, matching the existing `/athletes/hometowns` endpoint.

---

## Error Handling

| Scenario | HTTP status | Response body |
|---|---|---|
| Vertex AI returns an error | `502 Bad Gateway` | `{ "detail": "<upstream error message>" }` |
| Required env var missing at startup | Server refuses to start | Printed to stderr |
| Invalid request body (missing fields) | `422 Unprocessable Entity` | Standard FastAPI validation error (automatic) |

---

## README Documentation

After the existing API section, add an **Agent API** subsection documenting both endpoints with `curl` examples:

- `POST /agent/sessions` — show creating a session and capturing the session ID.
- `POST /agent/chat` — show sending a message using the captured session ID.

Include a note about the required environment variables for running locally.

---

## Acceptance Criteria

1. `POST /agent/sessions` returns a non-empty `session_id` string in `{ "session_id": "..." }` and status `201`.
2. `POST /agent/chat` with a valid `session_id` and `message` returns a non-empty `reply` string and status `200`.
3. If Vertex AI returns an error, the endpoint responds with `502` and includes the upstream error detail in `{ "detail": "..." }`.
4. Starting the server without one of the required env vars prints a clear error and exits non-zero.
5. README contains working `curl` examples for both endpoints, including how to capture the session ID from the first call and reuse it in the second.

---

## Out of Scope

- Session deletion endpoint.
- Streaming / SSE responses.
- Per-caller authentication or rate limiting.
- Storing conversation history on the backend side.
- Any UI changes.
