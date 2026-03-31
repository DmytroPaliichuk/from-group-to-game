import csv
import json
from pathlib import Path

temp_jsons = Path(__file__).parent / "temp_jsons"
output_csv = Path(__file__).parent / "athletes.csv"

FIELDNAMES = ["first_name", "last_name", "city", "state", "sport_title", "sport_type", "sport_season"]

with open(output_csv, "w", newline="") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=FIELDNAMES)
    writer.writeheader()

    for json_file in sorted(temp_jsons.glob("athletes_*.json")):
        with open(json_file) as f:
            data = json.load(f)

        for entry in data.get("entries", []):
            first_name = entry.get("first_name", "").strip()
            last_name = entry.get("last_name", "").strip()

            quick_facts = entry.get("bio", {}).get("quick_facts", {})
            hometown = quick_facts.get("hometown", {})
            city = hometown.get("city", "")
            state = hometown.get("state", "")

            sports = entry.get("sport", [])
            if sports:
                for sport in sports:
                    writer.writerow({
                        "first_name": first_name,
                        "last_name": last_name,
                        "city": city,
                        "state": state,
                        "sport_title": sport.get("title", ""),
                        "sport_type": sport.get("type", ""),
                        "sport_season": sport.get("season", ""),
                    })
            else:
                writer.writerow({
                    "first_name": first_name,
                    "last_name": last_name,
                    "city": city,
                    "state": state,
                    "sport_title": "",
                    "sport_type": "",
                    "sport_season": "",
                })

print(f"Saved to {output_csv}")
