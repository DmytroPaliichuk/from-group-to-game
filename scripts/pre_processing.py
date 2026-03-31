import html as html_module
import json
import os
import re
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

import vertexai
from vertexai.generative_models import GenerationConfig, GenerativeModel

INPUT_DIR = Path("temp_jsons")
OUTPUT_DIR = Path("process_jsons")

OUTPUT_DIR.mkdir(exist_ok=True)

load_dotenv()

unfilled_athletes = []


def extract_image_urls(image_list):
    return [{"secure_url": img["secure_url"]} for img in image_list if img.get("secure_url")]


def is_empty(value):
    return value is None or value == "" or value == [] or value == {}


def check_missing_fields(athlete):
    bio = athlete.get("bio", {})
    hometown = bio.get("hometown", {})

    missing = []
    if is_empty(athlete.get("first_name")):
        missing.append("first_name")
    if is_empty(athlete.get("last_name")):
        missing.append("last_name")
    if is_empty(bio.get("height")):
        missing.append("height")
    if is_empty(bio.get("birthday")):
        missing.append("birthday")
    if is_empty(hometown.get("city")):
        missing.append("city")
    if is_empty(hometown.get("state")):
        missing.append("state")
    if is_empty(hometown.get("country")):
        missing.append("country")
    if is_empty(bio.get("education")):
        missing.append("education")
    if is_empty(athlete.get("medals")):
        missing.append("medals")
    if is_empty(athlete.get("olympic_paralympic")):
        missing.append("olympic_paralympic")
    if is_empty(athlete.get("sport")):
        missing.append("sport")

    return missing


class GeminiEnricher:
    def __init__(self):
        vertexai.init(
            project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
            location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
        )
        self.model = GenerativeModel(os.environ.get("GEMINI_MODEL"))

    def _strip_html(self, text):
        if not text:
            return ""
        text = re.sub(r"<[^>]+>", " ", text)
        text = html_module.unescape(text)
        text = re.sub(r"\s+", " ", text).strip()
        return text[:1500]

    def _build_prompt(self, athlete, missing_fields):
        bio = athlete.get("bio", {})
        hometown = bio.get("hometown", {})
        sports = athlete.get("sport", [])
        sport_titles = ", ".join(s.get("title", "") for s in sports if s.get("title"))

        bio_excerpt = self._strip_html(bio.get("biography", "")) or "No biography available."

        known = []
        known.append(f"Name: {athlete.get('first_name', '')} {athlete.get('last_name', '')}")
        if sport_titles:
            known.append(f"Sport(s): {sport_titles}")
        if athlete.get("olympic_paralympic"):
            known.append(f"Status: {athlete['olympic_paralympic']}")
        if athlete.get("olympian_paralympian_years"):
            known.append(f"Olympic/Paralympic years: {athlete['olympian_paralympian_years']}")
        if athlete.get("para_classification"):
            known.append(f"Para classification: {athlete['para_classification']}")
        if bio.get("birthday") and "birthday" not in missing_fields:
            known.append(f"Birthday: {bio['birthday']}")
        if bio.get("height") and "height" not in missing_fields:
            known.append(f"Height: {bio['height']}")
        if hometown.get("city") and "city" not in missing_fields:
            known.append(f"Hometown city: {hometown['city']}")
        if hometown.get("state") and "state" not in missing_fields:
            known.append(f"Hometown state: {hometown['state']}")

        field_descriptions = {
            "first_name": 'first_name: string (athlete\'s first name)',
            "last_name": 'last_name: string (athlete\'s last name)',
            "height": 'height: string (e.g. "6\'2\\"" or "188 cm"), or null',
            "birthday": 'birthday: string ISO format YYYY-MM-DD, or null',
            "city": 'city: string (hometown city), or null',
            "state": 'state: string (full US state name), or null',
            "country": 'country: string (e.g. "United States"), or null',
            "education": 'education: string (college/university attended), or null',
            "medals": 'medals: object {"gold": int, "silver": int, "bronze": int}, or null',
            "olympic_paralympic": 'olympic_paralympic: string ("Olympian", "Paralympian", or "Team USA"), or null',
            "sport": 'sport: array of {"title": str, "type": str, "season": str}, or []',
        }

        fields_to_fill = "\n".join(
            f"- {field_descriptions[f]}" for f in missing_fields if f in field_descriptions
        )

        return f"""You are a sports data assistant. Given information about a Team USA athlete, fill in the missing fields using your knowledge. Return ONLY a JSON object with exactly the missing fields listed below. Return null for any field you cannot determine with confidence. Do not guess.

ATHLETE INFORMATION:
{chr(10).join(known)}

BIOGRAPHY EXCERPT:
{bio_excerpt}

MISSING FIELDS TO FILL (return a JSON object with exactly these keys):
{fields_to_fill}

Return only valid JSON. No explanation, no markdown, no extra keys."""

    def _call_with_retry(self, prompt, max_retries=3):
        delays = [2, 4, 8]
        last_error = None
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(
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

    def enrich(self, athlete, missing_fields):
        prompt = self._build_prompt(athlete, missing_fields)
        print("--------------------------------")
        print("Prompt:")
        print(prompt)
        print("--------------------------------")
        result = self._call_with_retry(prompt)
        print("--------------------------------")
        print("Result:")
        print(result)
        print("--------------------------------")
        if result is None:
            return athlete

        bio = athlete["bio"]
        hometown = bio["hometown"]

        for field in missing_fields:
            val = result.get(field)
            if val is None:
                continue
            if field == "height":
                bio["height"] = val
            elif field == "birthday":
                bio["birthday"] = val
            elif field == "city":
                hometown["city"] = val
            elif field == "state":
                hometown["state"] = val
            elif field == "country":
                hometown["country"] = val
            elif field == "education":
                bio["education"] = val
            elif field in ("first_name", "last_name", "medals", "olympic_paralympic", "sport"):
                athlete[field] = val

        return athlete


def process_athlete(athlete):
    bio_raw = athlete.get("bio", {})
    quick_facts = bio_raw.get("quick_facts", {})
    hometown = quick_facts.get("hometown", {})

    bio = {
        "height": quick_facts.get("height"),
        "birthday": quick_facts.get("birthday"),
        "hometown": {
            "city": hometown.get("city"),
            "state": hometown.get("state"),
        },
        "education": quick_facts.get("education"),
        "fun_fact": quick_facts.get("fun_fact"),
        "biography": bio_raw.get("biography"),
        "image": extract_image_urls(bio_raw.get("image", [])),
    }

    if bio['hometown']['city'] is not None and bio['hometown']['state'] is not None:
        bio['hometown']['country'] = 'United States'
    else:
        bio['hometown']['country'] = None

    sports = [
        {"title": s.get("title"), "type": s.get("type"), "season": s.get("season")}
        for s in athlete.get("sport", [])
    ]

    return {
        "first_name": athlete.get("first_name", "").strip(),
        "last_name": athlete.get("last_name", "").strip(),
        "bio": bio,
        "medals": athlete.get("medals"),
        "olympic_paralympic": athlete.get("olympic_paralympic"),
        "sport": sports,
        "olympian_paralympian_years": athlete.get("olympian_paralympian_years"),
        "olympian_paralympian_qualified": athlete.get("olympian_paralympian_qualified"),
        "para_classification": athlete.get("para_classification"),
        "hero_image": extract_image_urls(athlete.get("hero_image", [])),
        "featured_image_list": extract_image_urls(athlete.get("featured_image_list", [])),
        "thumbnail_image_list": extract_image_urls(athlete.get("thumbnail_image_list", [])),
        "content_tags": [{"title": t.get("title")} for t in athlete.get("content_tags", [])],
    }


def process_file(input_path, output_path):
    with open(input_path) as f:
        data = json.load(f)

    entries = []
    for a in data.get("entries", []):
        processed = process_athlete(a)
        if not check_missing_fields(processed):
            entries.append(processed)

    with open(output_path, "w") as f:
        json.dump({"entries": entries}, f, indent=2, ensure_ascii=False)


def main():
    # Phase 1: transform raw files → process_jsons/
    files = sorted(INPUT_DIR.glob("*.json"))
    for input_path in files:
        output_path = OUTPUT_DIR / input_path.name
        process_file(input_path, output_path)
        print(f"Processed {input_path.name}")
    print(f"\nDone. {len(files)} files written to {OUTPUT_DIR}/")

    # Phase 2: collect all athletes, identify missing fields
    all_athletes = []
    for output_path in sorted(OUTPUT_DIR.glob("athletes_*.json")):
        with open(output_path) as f:
            data = json.load(f)
        for athlete in data.get("entries", []):
            missing = check_missing_fields(athlete)
            if missing:
                unfilled_athletes.append({"athlete": athlete, "missing_fields": missing})
            all_athletes.append(athlete)

    print(f"\nFound {len(unfilled_athletes)} athletes with missing fields (out of {len(all_athletes)} total)")

    # Phase 3: enrich with Gemini via ADC
    try:
        enricher = GeminiEnricher()
    except Exception as e:
        if "credentials" in str(e).lower() or "authentication" in str(e).lower():
            print(
                "\n[ERROR] Authentication failed.\n"
                "Run: gcloud auth application-default login",
                file=sys.stderr,
            )
            sys.exit(1)
        raise

    for i, entry in enumerate(unfilled_athletes[:3]):
        athlete = entry["athlete"]
        missing = entry["missing_fields"]
        name = f"{athlete.get('first_name', '')} {athlete.get('last_name', '')}".strip()
        print(f"  Enriching [{i + 1}/{len(unfilled_athletes)}]: {name} (missing: {missing})")
        enricher.enrich(athlete, missing)
        time.sleep(0.1)

    # Phase 4: write combined output
    output_path = OUTPUT_DIR / "athletes_updated.json"
    with open(output_path, "w") as f:
        json.dump({"entries": all_athletes}, f, indent=2, ensure_ascii=False)
    print(f"\nWrote {len(all_athletes)} athletes to {output_path}")


if __name__ == "__main__":
    main()
