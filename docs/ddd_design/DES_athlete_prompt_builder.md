# DES: Athlete Prompt Builder Script

## Overview

A single Python script (`scripts/make_athelet_prompt.py`) composed of small, flat helper functions. No classes, no config objects, no third-party dependencies — just stdlib and a `main()` entry point.

---

## Data Flow

```
process_jsons/athletes_*.json
        │
        ▼  (sorted numerically by file number)
  load_entries(path)  →  list[dict]
        │
        ▼  (for each entry)
  format_athlete(entry)  →  str (one block)
        │
        ▼  (joined with "\n\n\n")
  athelet_sub_prompt.txt
```

---

## Module Structure

```
make_athelet_prompt.py
├── strip_html(html_text: str) -> str
├── format_date(iso_str: str) -> str | None
├── format_athlete(entry: dict) -> str
├── load_entries(path: Path) -> list[dict]
└── main() -> None
```

---

## Function Contracts

### `strip_html(html_text: str) -> str`

Converts an HTML string to plain text using regex (same pattern already used in `pre_processing.py`):

1. Replace all `<...>` tags with a single space via `re.sub(r"<[^>]+>", " ", text)`.
2. Unescape HTML entities via `html.unescape(text)`.
3. Collapse whitespace via `re.sub(r"\s+", " ", text).strip()`.

Returns empty string if input is falsy.

> **Rationale:** The existing codebase already uses this regex approach in `GeminiEnricher._strip_html`. Replicating the same pattern keeps the two scripts consistent without importing from each other.

---

### `format_date(iso_str: str) -> str | None`

Parses an ISO datetime string like `"1986-06-08T00:00:00"` and returns `"June 8, 1986"`.

- Use `datetime.strptime(iso_str, "%Y-%m-%dT%H:%M:%S")`.
- Format with `strftime("%-d")` for day-without-leading-zero on Linux/macOS, falling back to `strftime("%d").lstrip("0")` for portability.
- Return `None` on any parse error (catches `ValueError`).

---

### `format_athlete(entry: dict) -> str`

Builds the text block for one athlete. Returns a multi-line string (no trailing newline).

**Field assembly order:**

```
lines = []
lines.append(f"Name: {first} {last}")

if city and state:
    lines.append(f"Hometown: {city}, {state}")

if birthday_str:
    date = format_date(birthday_str)
    if date:
        lines.append(f"Birthday: {date}")

if education:
    lines.append(f"Education: {education}")

if gold + silver + bronze > 0:
    lines.append(f"Medals: Gold: {gold}, Silver: {silver}, Bronze: {bronze}")

for sport in sports:
    lines.append(f"Sport: {title} | {type_} | {season}")

if fun_fact:
    lines.append(f"Fun_fact: {fun_fact}")

bio_text = strip_html(biography)
if bio_text:
    lines.append(f"Biography: {bio_text}")

return "\n".join(lines)
```

All field reads use `.get()` with `None` defaults so a missing key never raises.

---

### `load_entries(path: Path) -> list[dict]`

Opens a single JSON file and returns `data["entries"]`.

- On `json.JSONDecodeError` or `OSError`: prints a warning to `stderr`, returns `[]`.

---

### `main() -> None`

```
INPUT_DIR  = Path(__file__).parent / "process_jsons"
OUTPUT_PATH = Path(__file__).parent / "athelet_sub_prompt.txt"

files = sorted(INPUT_DIR.glob("athletes_*.json"),
               key=lambda p: int(re.search(r"\d+", p.stem).group()))

blocks = []
for path in files:
    for entry in load_entries(path):
        blocks.append(format_athlete(entry))

OUTPUT_PATH.write_text("\n\n\n".join(blocks), encoding="utf-8")
print(f"Wrote {len(blocks)} athletes to {OUTPUT_PATH}")
```

**Numeric sort key:** `int(re.search(r"\d+", p.stem).group())` extracts the number from the filename stem so `athletes_2.json` sorts before `athletes_10.json`.

**Separator:** `"\n\n\n".join(blocks)` produces exactly 2 blank lines between blocks (one `\n` ends the last field line, two more produce the blank lines).

---

## File Paths (relative to repo root)

| Artifact | Path |
|----------|------|
| Script | `scripts/make_athelet_prompt.py` |
| Input dir | `scripts/process_jsons/athletes_*.json` |
| Output file | `scripts/athelet_sub_prompt.txt` |

---

## Error Handling

| Error | Handling |
|-------|----------|
| Malformed JSON | `load_entries` catches `JSONDecodeError`, warns to stderr, skips file |
| Missing top-level key in entry | `.get()` returns `None`; field is skipped by format logic |
| Unparseable birthday | `format_date` catches `ValueError`, returns `None`; field skipped |
| All medals zero | Checked by `gold + silver + bronze > 0` guard |
| Empty biography after strip | `if bio_text:` guard skips the field |

---

## Stdlib Imports Used

```python
import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path
```
