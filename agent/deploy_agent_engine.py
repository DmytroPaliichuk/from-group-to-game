#!/usr/bin/env python3
"""Deploy us_olympics_agent to Vertex AI Agent Engine."""

import os
import sys
from pathlib import Path

import vertexai
from vertexai import agent_engines
from vertexai.preview import reasoning_engines

from us_olympics_agent.agent import root_agent

SCRIPT_DIR = Path(__file__).parent
ENV_FILE = SCRIPT_DIR / "us_olympics_agent" / ".env"

# DISPLAY_NAME = "us-olympics-agent"
DISPLAY_NAME = "us-olympics-agent-rag-structured-output"
REQUIREMENTS = [
    "google-cloud-aiplatform[adk,agent_engines]",
    "chromadb>=0.6.0",
]


def load_env() -> None:
    if not ENV_FILE.exists():
        return
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())


def main() -> None:
    load_env()

    project = os.environ.get("GOOGLE_CLOUD_PROJECT", "")
    location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
    staging_bucket = os.environ.get("STAGING_BUCKET", "")

    if not project:
        sys.exit("ERROR: GOOGLE_CLOUD_PROJECT not set in us_olympics_agent/.env")
    if not staging_bucket:
        sys.exit("ERROR: STAGING_BUCKET not set in us_olympics_agent/.env")

    print(f"Project:        {project}")
    print(f"Location:       {location}")
    print(f"Staging bucket: {staging_bucket}")
    print(f"Display name:   {DISPLAY_NAME}\n")

    vertexai.init(project=project, location=location, staging_bucket=staging_bucket)

    app = reasoning_engines.AdkApp(
        agent=root_agent,
        enable_tracing=True,
    )

    print("Deploying to Agent Engine (this takes 5-10 minutes)...")
    remote = agent_engines.create(
        agent_engine=app,
        requirements=REQUIREMENTS,
        extra_packages=["us_olympics_agent"],
        display_name=DISPLAY_NAME,
        env_vars={
            "GOOGLE_GENAI_USE_VERTEXAI": "1",
        },
    )

    print(f"\nDeployed: {remote.resource_name}")


if __name__ == "__main__":
    main()
