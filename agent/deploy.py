#!/usr/bin/env python3
"""Deploy US Olympics Agent with ChromaDB to Cloud Run."""

import os
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
ENV_FILE = SCRIPT_DIR / "us_olympics_agent" / ".env"
CHROMA_DB = SCRIPT_DIR / "us_olympics_agent" / "chroma_db"

REPO_NAME = "us-olympics-agent"
IMAGE_NAME = "us-olympics-agent"
SERVICE_NAME = "us-olympics-agent"


def load_env() -> None:
    if not ENV_FILE.exists():
        return
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())


def run(cmd: list[str], **kwargs) -> None:
    print(f"$ {' '.join(cmd)}")
    subprocess.run(cmd, check=True, **kwargs)


def repo_exists(project: str, location: str) -> bool:
    return subprocess.run(
        [
            "gcloud", "artifacts", "repositories", "describe", REPO_NAME,
            "--location", location, "--project", project,
        ],
        capture_output=True,
    ).returncode == 0


def main() -> None:
    load_env()

    project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

    if not project:
        sys.exit("ERROR: GOOGLE_CLOUD_PROJECT not set in us_olympics_agent/.env")

    if not CHROMA_DB.exists():
        sys.exit(
            f"ERROR: ChromaDB not found at {CHROMA_DB}\n"
            "Run: uv run python us_olympics_agent/build_index.py"
        )

    registry = f"{location}-docker.pkg.dev"
    image_uri = f"{registry}/{project}/{REPO_NAME}/{IMAGE_NAME}:latest"

    print(f"Project:  {project}")
    print(f"Location: {location}")
    print(f"Image:    {image_uri}\n")

    # 1. Create Artifact Registry repo if it doesn't exist yet
    print("[1/5] Artifact Registry repo")
    if repo_exists(project, location):
        print(f"  '{REPO_NAME}' already exists")
    else:
        run([
            "gcloud", "artifacts", "repositories", "create", REPO_NAME,
            "--repository-format=docker",
            "--location", location,
            "--project", project,
        ])

    # 2. Authenticate Docker to push to Artifact Registry
    print("\n[2/5] Docker auth")
    run(["gcloud", "auth", "configure-docker", registry, "--quiet"])

    # 3. Build — Dockerfile copies us_olympics_agent/ which includes chroma_db/
    print("\n[3/5] Build Docker image")
    run(["docker", "build", "--platform", "linux/amd64", "-t", image_uri, str(SCRIPT_DIR)])

    # 4. Push to Artifact Registry
    print("\n[4/5] Push to Artifact Registry")
    run(["docker", "push", image_uri])

    # 5. Deploy to Cloud Run
    print("\n[5/5] Deploy to Cloud Run")
    run([
        "gcloud", "run", "deploy", SERVICE_NAME,
        "--image", image_uri,
        "--project", project,
        "--region", location,
        "--platform", "managed",
        "--set-env-vars",
        f"GOOGLE_CLOUD_PROJECT={project},GOOGLE_CLOUD_LOCATION={location},GOOGLE_GENAI_USE_VERTEXAI=1",
        "--allow-unauthenticated",
    ])

    print(f"\nDone. Agent is running on Cloud Run as '{SERVICE_NAME}'.")


if __name__ == "__main__":
    main()
