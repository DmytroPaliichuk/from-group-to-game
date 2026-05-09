import json
import os
import sys
from pathlib import Path

import vertexai
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from vertexai import agent_engines

from dotenv import load_dotenv

try:
    load_dotenv()
except Exception as exc:
    print(f"Error loading dotenv file: {exc}")

# Fail fast at startup so misconfigured deployments are caught immediately.
_PROJECT_ID = os.environ.get("PROJECT_ID")
_LOCATION = os.environ.get("LOCATION")
_AGENT_ENGINE_ID = os.environ.get("AGENT_ENGINE_ID")

_missing = [k for k, v in {
    "PROJECT_ID": _PROJECT_ID,
    "LOCATION": _LOCATION,
    "AGENT_ENGINE_ID": _AGENT_ENGINE_ID,
}.items() if not v]

if _missing:
    sys.exit(f"Missing required env vars: {', '.join(_missing)}")

vertexai.init(project=_PROJECT_ID, location=_LOCATION)
_engine = agent_engines.get(
    f"projects/{_PROJECT_ID}/locations/{_LOCATION}"
    f"/reasoningEngines/{_AGENT_ENGINE_ID}"
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

DATA_DIR = Path(__file__).parent / "data"


def _load_athletes():
    athletes = []
    for path in sorted(DATA_DIR.glob("athletes_*.json")):
        data = json.loads(path.read_text())
        athletes.extend(data.get("entries", []))
    return athletes


_athletes = _load_athletes()


class SessionRequest(BaseModel):
    user_id: str

class SessionResponse(BaseModel):
    session_id: str


class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str


class ChatResponse(BaseModel):
    reply: str


@app.get("/athletes/hometowns")
def get_hometowns(state: str | None = Query(default=None)):
    result = []
    for a in _athletes:
        hometown = a.get("bio", {}).get("hometown")
        if hometown:
            if state is None or hometown.get("state") == state:
                result.append({
                    "first_name": a.get("first_name"),
                    "last_name": a.get("last_name"),
                    "hometown": hometown,
                    "olympic_paralympic": a.get("olympic_paralympic"),
                    "seasons": list({s.get("season") for s in a.get("sport", []) if s.get("season")}),
                    "medals": a.get("medals", {"gold": 0, "silver": 0, "bronze": 0}),
                    "sports": list({s.get("title") for s in a.get("sport", []) if s.get("title")}),
                    "thumbnail_image_list": a.get("thumbnail_image_list", [])[:1],
                })
    return result


@app.post("/agent/sessions", status_code=201)
def create_session(req: SessionRequest) -> SessionResponse:
    try:
        session = _engine.create_session(user_id=req.user_id)
        return SessionResponse(session_id=session["id"])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))


@app.post("/agent/chat")
def chat(req: ChatRequest) -> ChatResponse:
    try:
        parts = []
        for event in _engine.stream_query(
            user_id=req.user_id,
            session_id=req.session_id,
            message=req.message,
        ):
            # event shape: {"content": {"parts": [{"text": "..."}]}}
            # Verify against live SDK if this yields empty strings.
            for part in event.get("content", {}).get("parts", []):
                if text := part.get("text"):
                    parts.append(text)
        return ChatResponse(reply="".join(parts))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))
