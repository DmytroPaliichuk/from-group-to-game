# From Group to Game — Backend

FastAPI backend serving athlete data for the From Group to Game project.

## Requirements

- Python 3.14+
- [uv](https://docs.astral.sh/uv/) (package manager)

## Setup

```bash
# Install dependencies
uv sync

# Run the development server
uv run uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

## API

### `GET /athletes/hometowns`

Returns a list of athletes with their hometown information.

**Response**

```json
[
  {
    "first_name": "Katie",
    "last_name": "(Holloway) Bridge",
    "hometown": {
      "city": "Lake Stevens",
      "state": "WA",
      "country": "United States",
      "latitude": 48.0084,
      "longitude": -122.0865
    }
  }
]
```

## Data

Athlete data is loaded from JSON files in the `data/` directory (`athletes_*.json`). Each file contains an `entries` array of athlete objects with bio, medal, and classification information sourced from Team USA profiles.

The `data/` directory is excluded from version control due to its size. Add your own data files following the same naming convention to populate the API.

