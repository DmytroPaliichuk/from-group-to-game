"""One-time script to chunk athletes_sub_prompt.txt and build the ChromaDB index.

Run from the agent/ directory:
    uv run python us_olympics_agent/build_index.py

Re-run whenever athletes_sub_prompt.txt changes to rebuild the index.
"""

import os
import time
from pathlib import Path

import chromadb
import vertexai
from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel

_DIR = Path(__file__).parent
_DATA_PATH = _DIR / "athletes_sub_prompt.txt"
_CHROMA_PATH = _DIR / "chroma_db"
_COLLECTION_NAME = "athletes"
_EMBEDDING_MODEL = "text-embedding-004"
# text-embedding-004 supports up to 250 inputs per request; 20 keeps request
# size well within the character-per-request limit for verbose athlete bios.
_BATCH_SIZE = 1


def _load_env() -> None:
    """Load variables from .env into os.environ without requiring python-dotenv."""
    env_path = _DIR / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


def _embed_batch(
    texts: list[str], task_type: str, model: TextEmbeddingModel
) -> list[list[float]]:
    # Inlined here (not imported from rag.py) to avoid the module-level
    # get_collection() in rag.py triggering before the index exists.
    inputs = [TextEmbeddingInput(text=t, task_type=task_type) for t in texts]
    return [emb.values for emb in model.get_embeddings(inputs)]


def main() -> None:
    _load_env()

    raw = _DATA_PATH.read_text(encoding="utf-8")
    chunks = [block.strip() for block in raw.split("\n\n\n") if block.strip()]
    total = len(chunks)
    print(f"Found {total} athlete profiles. Embedding in batches of {_BATCH_SIZE}...")

    # Initialize once — avoid repeated vertexai.init() + from_pretrained() per call.
    vertexai.init(
        project=os.environ["GOOGLE_CLOUD_PROJECT"],
        location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
    )
    model = TextEmbeddingModel.from_pretrained(_EMBEDDING_MODEL)

    embeddings: list[list[float]] = []
    total_start = time.perf_counter()
    for batch_start in range(0, total, _BATCH_SIZE):
        batch = chunks[batch_start : batch_start + _BATCH_SIZE]
        batch_embeddings = _embed_batch(batch, "RETRIEVAL_DOCUMENT", model)
        embeddings.extend(batch_embeddings)

        done = min(batch_start + _BATCH_SIZE, total)
        elapsed = time.perf_counter() - total_start
        eta = elapsed / done * (total - done)
        print(f"  {done}/{total} embedded  (elapsed {elapsed:.0f}s, eta {eta:.0f}s)", flush=True)

    client = chromadb.PersistentClient(path=str(_CHROMA_PATH))
    collection = client.get_or_create_collection(_COLLECTION_NAME)
    ids = [f"{i:04d}" for i in range(total)]
    collection.upsert(ids=ids, embeddings=embeddings, documents=chunks)

    print(f"Indexed {total} athletes to chroma_db/")


if __name__ == "__main__":
    main()
