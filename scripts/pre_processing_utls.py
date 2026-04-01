import argparse
import csv
import json
import os
import sys
import time
from pathlib import Path

import vertexai
from dotenv import load_dotenv
from vertexai.generative_models import GenerationConfig, GenerativeModel

load_dotenv()

SCRIPT_DIR = Path(__file__).parent
PROCESS_JSONS_DIR = SCRIPT_DIR / "process_jsons"
OUTPUT_CSV = SCRIPT_DIR / "athletes_cities.csv"
CITY_MAPPING_CSV = SCRIPT_DIR / "city_mapping.csv"

BATCH_SIZE = 30


def extract_city():
    rows = []
    for json_file in sorted(PROCESS_JSONS_DIR.glob("athletes_[0-9]*.json")):
        with open(json_file, encoding="utf-8") as f:
            data = json.load(f)
        for entry in data.get("entries", []):
            hometown = entry.get("bio", {}).get("hometown", {}) or {}
            rows.append({
                "first_name": entry.get("first_name", "") or "",
                "last_name": entry.get("last_name", "") or "",
                "city": hometown.get("city", "") or "",
                "state": hometown.get("state", "") or "",
            })

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["first_name", "last_name", "city", "state"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUTPUT_CSV}")


def _init_gemini():
    vertexai.init(
        project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
        location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
    )
    return GenerativeModel(os.environ.get("GEMINI_MODEL"))


def _call_with_retry(model, prompt, max_retries=3):
    delays = [2, 4, 8]
    last_error = None
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    response_mime_type="application/json",
                    temperature=0.1,
                ),
            )
            return json.loads(response.text)
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            if ("429" in error_str or "503" in error_str or "rate" in error_str) and attempt < max_retries - 1:
                time.sleep(delays[attempt])
                continue
            break
    print(f"  [ERROR] {last_error}", file=sys.stderr)
    return None


def _geolocate_batch(model, batch):
    """Ask Gemini to return lat/lng for a list of (city, state) pairs."""
    locations = "\n".join(
        f'{i + 1}. {row["city"]}, {row["state"]}' for i, row in enumerate(batch)
    )
    prompt = (
        "Return the geographic coordinates for each city below.\n"
        "Respond with a JSON array where each element has exactly these keys: "
        '"city", "state", "latitude", "longitude".\n'
        "Use decimal degrees (e.g. 37.7749, -122.4194). "
        "Preserve the original city and state spelling from the input. "
        "Return only valid JSON. No explanation, no markdown.\n\n"
        f"Cities:\n{locations}"
    )
    return _call_with_retry(model, prompt)


def create_city_mapping(input_csv: Path):
    # Read unique (city, state) pairs, skip blanks
    pairs = set()
    with open(input_csv, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            city = (row.get("city") or "").strip()
            state = (row.get("state") or "").strip()
            if city and state:
                pairs.add((city, state))

    unique = [{"city": c, "state": s} for c, s in sorted(pairs)]
    print(f"Found {len(unique)} unique city/state pairs — querying Gemini in batches of {BATCH_SIZE}...")

    model = _init_gemini()
    results = []

    for start in range(0, len(unique), BATCH_SIZE):
        batch = unique[start: start + BATCH_SIZE]
        end = min(start + BATCH_SIZE, len(unique))
        print(f"  Batch {start + 1}–{end} of {len(unique)}...")
        data = _geolocate_batch(model, batch)
        if data:
            results.extend(data)
        time.sleep(0.2)

    with open(CITY_MAPPING_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["city", "state", "latitude", "longitude"])
        writer.writeheader()
        writer.writerows(results)

    print(f"Wrote {len(results)} rows to {CITY_MAPPING_CSV}")


TASKS = {
    "extract-city": extract_city,
    "create-city-mapping": create_city_mapping,
}


def main():
    parser = argparse.ArgumentParser(description="Pre-processing utilities")
    parser.add_argument("-t", "--task", required=True, choices=TASKS, help="Task to run")
    parser.add_argument("-i", "--input", type=Path, default=OUTPUT_CSV,
                        help="Input CSV for create-city-mapping (default: athletes_cities.csv)")
    args = parser.parse_args()

    if args.task == "create-city-mapping":
        create_city_mapping(args.input)
    else:
        TASKS[args.task]()


if __name__ == "__main__":
    main()
