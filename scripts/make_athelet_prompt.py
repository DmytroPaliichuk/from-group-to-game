import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path

INPUT_DIR = Path(__file__).parent / "process_jsons"
OUTPUT_PATH = Path(__file__).parent / "athelet_sub_prompt.txt"


def strip_html(html_text: str) -> str:
    if not html_text:
        return ""
    text = re.sub(r"<[^>]+>", " ", html_text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def format_date(iso_str: str) -> str | None:
    try:
        dt = datetime.strptime(iso_str, "%Y-%m-%dT%H:%M:%S")
        return dt.strftime("%B %-d, %Y")
    except ValueError:
        return None


def format_athlete(entry: dict) -> str:
    first = entry.get("first_name", "")
    last = entry.get("last_name", "")
    bio = entry.get("bio", {})
    hometown = bio.get("hometown", {})
    medals = entry.get("medals") or {}
    sports = entry.get("sport") or []

    lines = [f"Name: {first} {last}".strip()]

    city = hometown.get("city")
    state = hometown.get("state")
    if city and state:
        lines.append(f"Hometown: {city}, {state}")

    birthday_str = bio.get("birthday")
    if birthday_str:
        date = format_date(birthday_str)
        if date:
            lines.append(f"Birthday: {date}")

    education = bio.get("education")
    if education:
        lines.append(f"Education: {education}")

    gold = medals.get("gold", 0) or 0
    silver = medals.get("silver", 0) or 0
    bronze = medals.get("bronze", 0) or 0
    if gold + silver + bronze > 0:
        lines.append(f"Medals: Gold: {gold}, Silver: {silver}, Bronze: {bronze}")

    for sport in sports:
        title = sport.get("title", "")
        type_ = sport.get("type", "")
        season = sport.get("season", "")
        lines.append(f"Sport: {title} | {type_} | {season}")

    fun_fact = bio.get("fun_fact")
    if fun_fact:
        lines.append(f"Fun_fact: {fun_fact}")

    bio_text = strip_html(bio.get("biography"))
    if bio_text:
        lines.append(f"Biography: {bio_text}")

    return "\n".join(lines)


def load_entries(path: Path) -> list[dict]:
    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        return data.get("entries", [])
    except (json.JSONDecodeError, OSError) as e:
        print(f"Warning: skipping {path.name}: {e}", file=sys.stderr)
        return []


def main() -> None:
    files = sorted(
        INPUT_DIR.glob("athletes_*.json"),
        key=lambda p: int(re.search(r"\d+", p.stem).group()),
    )

    blocks = []
    for path in files:
        for entry in load_entries(path):
            blocks.append(format_athlete(entry))

    OUTPUT_PATH.write_text("\n\n\n".join(blocks), encoding="utf-8")
    print(f"Wrote {len(blocks)} athletes to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
