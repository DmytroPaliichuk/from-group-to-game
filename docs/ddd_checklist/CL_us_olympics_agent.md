# CL: US Olympics Agent

**Design:** `docs/ddd_design/DES_us_olympics_agent.md`  
**Requirements:** `docs/ddd_requirement/REQ_us_olympics_agent.md`  
**Date:** 2026-05-09

---

## Tasks

### Task 1 — Add dependencies and gitignore entry
**Status:** `completed`  
**Files:** `agent/pyproject.toml`, `.gitignore`

Add `chromadb>=0.6.0` and `google-cloud-aiplatform>=1.60.0` to the `[project].dependencies` list in `pyproject.toml`. Add `agent/us_olympics_agent/chroma_db/` to the root `.gitignore`.

Run `uv sync` to lock the new packages.

> Merged with infrastructure because these ~15 lines are below the minimum meaningful diff size on their own and must land before any code in Tasks 2–4 can be developed or run.

---

### Task 2 — Create `rag.py` (ChromaDB init + embed helper + search tool)
**Status:** `completed`  
**Files:** `agent/us_olympics_agent/rag.py` *(new)*

Create `rag.py` with three responsibilities:

1. **Module-level ChromaDB init** — instantiate a `chromadb.PersistentClient` pointing at `Path(__file__).parent / "chroma_db"` and call `get_collection("athletes")`. If the collection or directory does not exist, raise a `RuntimeError("Index not found. Run build_index.py first.")`.

2. **`_embed(text: str, task_type: str) -> list[float]`** — internal helper that calls Vertex AI `text-embedding-004` with the given task type (`RETRIEVAL_DOCUMENT` or `RETRIEVAL_QUERY`) and returns the embedding vector. Uses `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_LOCATION` from the environment.

3. **`search_athletes(query: str, k: int = 5) -> str`** — the ADK tool function. Embeds `query` with task type `RETRIEVAL_QUERY`, calls `collection.query(query_embeddings=[vector], n_results=k)`, joins returned documents with `"\n\n---\n\n"`, and returns the result. Returns the string `"NO_RESULTS_FOUND"` if the collection returns zero documents.

Expected diff: ~70–90 lines.

---

### Task 3 — Create `build_index.py` (one-time index build script)
**Status:** `completed`  
**Files:** `agent/us_olympics_agent/build_index.py` *(new)*

Create `build_index.py` as a standalone script (run via `uv run python us_olympics_agent/build_index.py`).

Steps it performs:
1. Read `Path(__file__).parent / "athletes_sub_prompt.txt"` and split on `"\n\n\n"`.
2. Strip whitespace and discard empty blocks.
3. For each block, call `_embed(block, "RETRIEVAL_DOCUMENT")` from `rag.py` to get its vector.
4. Upsert all chunks into the ChromaDB `athletes` collection in the persistent client at `Path(__file__).parent / "chroma_db"`. Use zero-padded string IDs (`"0000"`, `"0001"`, …).
5. Print a completion line: `"Indexed {n} athletes to chroma_db/"`.

The script creates the `athletes` collection if it does not already exist (use `get_or_create_collection`). It must import `_embed` from `rag.py` for the embedding step.

Expected diff: ~60–70 lines.

---

### Task 4 — Update `agent.py` (wire RAG tool + system instruction)
**Status:** `completed`  
**Files:** `agent/us_olympics_agent/agent.py`

Replace the existing minimal `agent.py` with the full agent definition:

1. Import `search_athletes` from `us_olympics_agent.rag`.
2. Define a `INSTRUCTION` string constant with the system prompt from the design doc (7 numbered rules covering: always call the tool first, ground answers in returned data, no speculation, handle `NO_RESULTS_FOUND` with training-data fallback + explicit disclosure, resolve ambiguous names by listing candidates, decline off-topic queries, respond in English only).
3. Update the `Agent(...)` constructor: set `name='us_olympics_agent'`, `description='Expert assistant for US Olympic and Paralympic athlete information.'`, `instruction=INSTRUCTION`, `tools=[search_athletes]`.

Expected diff: ~35–45 lines (replaces the 8-line stub entirely).

---

## Dependency Order

```
Task 1 (deps + gitignore)
    └── Task 2 (rag.py)
            ├── Task 3 (build_index.py)   # imports _embed from rag.py
            └── Task 4 (agent.py)         # imports search_athletes from rag.py
```

Tasks 3 and 4 are independent of each other and can be implemented in either order after Task 2 lands.
