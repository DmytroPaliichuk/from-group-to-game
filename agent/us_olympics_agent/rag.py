import os
from pathlib import Path

import chromadb
from chromadb.errors import NotFoundError
import vertexai
from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel

_CHROMA_PATH = Path(__file__).parent / "chroma_db"
_COLLECTION_NAME = "athletes"
_EMBEDDING_MODEL = "text-embedding-004"

# Fail fast at import time if the index hasn't been built yet, so the developer
# sees a clear message rather than a cryptic tool-call failure during a live session.
_client = chromadb.PersistentClient(path=str(_CHROMA_PATH))
try:
    _collection = _client.get_collection(_COLLECTION_NAME)
except NotFoundError as exc:
    raise RuntimeError(
        f"Index not found at {_CHROMA_PATH}. Run build_index.py first."
    ) from exc


def _embed(text: str, task_type: str) -> list[float]:
    vertexai.init(
        project=os.environ["GOOGLE_CLOUD_PROJECT"],
        location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
    )
    model = TextEmbeddingModel.from_pretrained(_EMBEDDING_MODEL)
    inputs = [TextEmbeddingInput(text=text, task_type=task_type)]
    return model.get_embeddings(inputs)[0].values


def search_athletes(query: str, k: int = 25) -> str:
    """Search the US Olympics athlete dataset and return matching profiles.

    Args:
        query: Natural-language search query (athlete name, sport, medals, etc.)
        k: Number of profiles to return (default 5).

    Returns:
        Matching athlete profiles separated by horizontal rules, or
        "NO_RESULTS_FOUND" if nothing matched.
    """
    vector = _embed(query, "RETRIEVAL_QUERY")
    results = _collection.query(
        query_embeddings=[vector],
        n_results=k,
        include=["documents"],
    )
    docs = results.get("documents", [[]])[0]
    if not docs:
        return "NO_RESULTS_FOUND"
    return "\n\n---\n\n".join(docs)
