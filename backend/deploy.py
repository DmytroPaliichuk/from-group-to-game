#!/usr/bin/env python3
"""Deploy the FastAPI backend to Google Cloud Run."""

import shutil
import subprocess
import sys
from pathlib import Path

REQUIRED_VARS = ["PROJECT_ID", "LOCATION", "AGENT_ENGINE_ID", "SERVICE_ACCOUNT"]
SERVICE_NAME = "from-group-to-game-backend"
REGION = "us-central1"
SCRIPT_DIR = Path(__file__).parent


def load_env(env_path: Path) -> dict[str, str]:
    if not env_path.exists():
        sys.exit(f"Error: .env not found at {env_path}")
    env: dict[str, str] = {}
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        key, _, value = line.partition("=")
        value = value.strip()
        if " #" in value:
            value = value[:value.index(" #")].strip()
        env[key.strip()] = value
    return env


def check_gcloud() -> None:
    if shutil.which("gcloud") is None:
        sys.exit(
            "Error: gcloud CLI not found — install the Google Cloud SDK"
            " and authenticate with `gcloud auth login`."
        )


def deploy(env_vars: dict[str, str]) -> None:
    env_str = ",".join(f"{k}={v}" for k, v in env_vars.items())
    cmd = [
        "gcloud", "run", "deploy", SERVICE_NAME,
        "--source", str(SCRIPT_DIR),
        "--region", REGION,
        "--allow-unauthenticated",
        "--service-account", env_vars["SERVICE_ACCOUNT"],
        "--set-env-vars", env_str,
    ]
    result = subprocess.run(cmd)
    if result.returncode != 0:
        sys.exit(result.returncode)


def get_service_url() -> str:
    result = subprocess.run(
        [
            "gcloud", "run", "services", "describe", SERVICE_NAME,
            "--region", REGION,
            "--format=value(status.url)",
        ],
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def main() -> None:
    env = load_env(SCRIPT_DIR / ".env")

    missing = [v for v in REQUIRED_VARS if not env.get(v)]
    if missing:
        sys.exit(f"Error: Missing required env vars in .env: {', '.join(missing)}")

    check_gcloud()

    env_vars = {k: env[k] for k in REQUIRED_VARS}
    deploy(env_vars)

    url = get_service_url()
    print(f"\nDeployed: {url}")


if __name__ == "__main__":
    main()
