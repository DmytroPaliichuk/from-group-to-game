AGENT_DIR ?= us_olympics_agent

-include $(AGENT_DIR)/.env
export

PROJECT_ID ?= $(GOOGLE_CLOUD_PROJECT)
LOCATION_ID ?= $(GOOGLE_CLOUD_LOCATION)
DISPLAY_NAME ?= US Olympics Agent

# Deploy to Cloud Run (container image — chroma_db baked in via Dockerfile)
deploy:
	uv run python deploy.py

# Deploy to Agent Engine (source-based — packages the whole agent dir including chroma_db)
deploy-agent-engine:
	uv run adk deploy agent_engine \
		--project=$(PROJECT_ID) \
		--region=$(LOCATION_ID) \
		--display_name="$(DISPLAY_NAME)" \
		$(AGENT_DIR)

.PHONY: deploy deploy-agent-engine
