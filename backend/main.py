import json
from pathlib import Path

from fastapi import FastAPI, Query

app = FastAPI()
DATA_DIR = Path(__file__).parent / "data"


def _load_athletes():
    athletes = []
    for path in sorted(DATA_DIR.glob("athletes_*.json")):
        data = json.loads(path.read_text())
        athletes.extend(data.get("entries", []))
    return athletes


_athletes = _load_athletes()


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
                })
    return result
