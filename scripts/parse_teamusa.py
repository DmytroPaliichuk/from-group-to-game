import json
import math
import time
import urllib.request
from pathlib import Path

BASE_URL = "https://www.teamusa.com/api/athletes"
LIMIT = 50
OUTPUT_DIR = Path(__file__).parent / "temp_jsons"

def fetch_page(skip: int) -> dict:
    url = f"{BASE_URL}?skip={skip}&limit={LIMIT}"
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read())

def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    # Fetch first page to get total
    data = fetch_page(skip=0)
    total = data["total"]
    pages = math.ceil(total / LIMIT)
    print(f"Total athletes: {total}, pages: {pages}")

    output_file = OUTPUT_DIR / "athletes_1.json"
    output_file.write_text(json.dumps(data, indent=2))
    print(f"Saved athletes_1.json")

    # Fetch remaining pages
    for i in range(1, pages):
        skip = i * LIMIT
        data = fetch_page(skip=skip)
        output_file = OUTPUT_DIR / f"athletes_{i + 1}.json"
        output_file.write_text(json.dumps(data, indent=2))
        print(f"Saved athletes_{i + 1}.json (skip={skip})")
        time.sleep(0.2)  # be polite to the API

if __name__ == "__main__":
    main()
