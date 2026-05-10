# From Group to Game — Backend

FastAPI backend serving athlete data for the From Group to Game project.

## Requirements

- Python 3.14+
- [uv](https://docs.astral.sh/uv/) (package manager)

## Setup

```bash
# Install dependencies
uv sync

# Set required environment variables (see Agent API section below)
export PROJECT_ID=<your-gcp-project-id>
export LOCATION=us-central1
export AGENT_ENGINE_ID=<your-agent-engine-id>

# Authenticate with GCP (local dev only)
gcloud auth application-default login

# Run the development server
uv run uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

## API

### `GET /athletes/hometowns`

Returns a list of athletes with their hometown information.

**Response**

```json
[
  {
    "first_name": "Katie",
    "last_name": "(Holloway) Bridge",
    "hometown": {
      "city": "Lake Stevens",
      "state": "WA",
      "country": "United States",
      "latitude": 48.0084,
      "longitude": -122.0865
    }
  }
]
```

## Agent API

The agent endpoints proxy to a deployed Vertex AI ADK agent. Three environment variables must be set before starting the server:

| Variable | Description |
|---|---|
| `PROJECT_ID` | GCP project ID |
| `LOCATION` | Vertex AI region (e.g. `us-central1`) |
| `AGENT_ENGINE_ID` | ADK agent engine ID |

### `POST /agent/sessions`

Creates a new conversation session for a given user. Returns a `session_id` to supply with every subsequent chat request. Use the same `user_id` for all chat calls within this session.

**Request body:** `{ "user_id": "<string>" }`

```bash
USER_ID="alice"
SESSION_ID=$(curl -s -X POST http://localhost:8000/agent/sessions \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\"}" | jq -r .session_id)
echo "Session: $SESSION_ID"
```

### `POST /agent/chat`

Sends a message to the agent and returns the complete reply. The `user_id` must match the one used when the session was created.

**Request body:** `{ "user_id": "<string>", "session_id": "<string>", "message": "<string>" }`

```bash
curl -s -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\", \"session_id\": \"$SESSION_ID\", \"message\": \"Find me a soccer group in Seattle\"}"
```

**Response**

```json
{ "reply": "Here are some soccer groups in Seattle..." }
```

## Data

Athlete data is loaded from JSON files in the `data/` directory (`athletes_*.json`). Each file contains an `entries` array of athlete objects with bio, medal, and classification information sourced from Team USA profiles.

The `data/` directory is excluded from version control due to its size. Add your own data files following the same naming convention to populate the API.

