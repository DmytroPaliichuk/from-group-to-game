FROM python:3.13-slim

WORKDIR /app

RUN pip install --no-cache-dir \
    "google-adk>=1.32.0" \
    "chromadb>=0.6.0" \
    "google-cloud-aiplatform>=1.60.0"

# Copy agent source — chroma_db/ lives inside us_olympics_agent/ so it's included here
COPY us_olympics_agent/ ./us_olympics_agent/

ENV PYTHONPATH=/app
EXPOSE 8080

CMD ["adk", "api_server", "--host", "0.0.0.0", "--port", "8080", "us_olympics_agent"]
