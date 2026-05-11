#!/usr/bin/env bash
set -euo pipefail

# --- Configuration (override via env vars) ---
PROJECT_ID="${PROJECT_ID:-}"
REGION="${REGION:-us-central1}"
SERVICE_NAME="${SERVICE_NAME:-from-group-to-game-frontend}"
REPO_NAME="${REPO_NAME:-from-group-to-game}"
IMAGE_NAME="${IMAGE_NAME:-frontend}"
API_URL="${API_URL:-https://from-group-to-game-backend-656681019973.us-central1.run.app}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"

# --- Prerequisite checks ---
if ! command -v gcloud &>/dev/null; then
  echo "Error: gcloud is not installed or not in PATH." >&2
  exit 1
fi

if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID env var is required." >&2
  exit 1
fi

ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null)
if [ -z "$ACTIVE_ACCOUNT" ]; then
  echo "Error: No active gcloud account. Run: gcloud auth login" >&2
  exit 1
fi

# --- Ensure Artifact Registry repository exists ---
if ! gcloud artifacts repositories describe "$REPO_NAME" \
     --location="$REGION" --project="$PROJECT_ID" &>/dev/null; then
  echo "Creating Artifact Registry repository: $REPO_NAME"
  gcloud artifacts repositories create "$REPO_NAME" \
    --repository-format=docker \
    --location="$REGION" \
    --project="$PROJECT_ID"
fi

# --- Build ---
echo "Building image: $IMAGE"
gcloud builds submit . \
  --project="$PROJECT_ID" \
  --config=cloudbuild.yaml \
  --substitutions="_IMAGE=${IMAGE},_NEXT_PUBLIC_API_URL=${API_URL},_NEXT_PUBLIC_GEMINI_API_KEY=${GEMINI_API_KEY}"

# --- Deploy ---
echo "Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --port=3000 \
  --allow-unauthenticated \
  --set-env-vars="API_URL=${API_URL}"

echo ""
echo "Deployment complete. Service URL:"
gcloud run services describe "$SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)"
