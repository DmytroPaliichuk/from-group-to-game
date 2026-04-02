import json
from pathlib import Path

from fastapi import FastAPI

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
def get_hometowns():
    result = []
    for a in _athletes:
        hometown = a.get("bio", {}).get("hometown")
        if hometown:
            result.append({
                "first_name": a.get("first_name"),
                "last_name": a.get("last_name"),
                "hometown": hometown,
            })
    return result
