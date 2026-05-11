# REQ: Athlete Prompt Builder Script

## Overview

A Python script (`make_athelet_prompt.py`) that reads all athlete JSON files from the `process_jsons/` directory and produces a single plain-text file (`athelet_sub_prompt.txt`) containing formatted athlete profiles, one per block, separated by two blank lines.

---

## Actors

- **Script operator** — the developer or pipeline runner who executes the script locally.

---

## Source Data

- **Input directory:** `scripts/process_jsons/`
- **File pattern:** all `athletes_*.json` files (171 files, ~3,099 entries total)
- **JSON structure per file:**
  ```
  {
    "entries": [
      {
        "first_name": "Katie",
        "last_name": "(Holloway) Bridge",
        "bio": {
          "birthday": "1986-06-08T00:00:00",
          "hometown": { "city": "Lake Stevens", "state": "WA" },
          "education": "Oklahoma State",
          "fun_fact": null,
          "biography": "<h5>Quick Facts</h5><ul><li>...</li></ul>..."
        },
        "medals": { "gold": 3, "silver": 2, "bronze": 0 },
        "sport": [
          { "title": "Sitting Volleyball", "type": "Paralympic", "season": "Summer" }
        ]
      }
    ]
  }
  ```

---

## Output

- **Output file:** `scripts/athelet_sub_prompt.txt`
- **Encoding:** UTF-8
- **Athlete ordering:** file order (sorted numerically by file number), then entry order within each file

---

## Per-Athlete Block Format

Each athlete is represented by one block of labeled fields. Fields are printed in this order:

```
Name: <first_name> <last_name>
Hometown: <city>, <state>
Birthday: <Month D, YYYY>
Education: <education>
Medals: Gold: <n>, Silver: <n>, Bronze: <n>
Sport: <title> | <type> | <season>
Fun_fact: <fun_fact>
Biography: <plain text>
```

**Rules per field:**

| Field | Format | Skip if absent/null? |
|-------|--------|----------------------|
| Name | `first_name` + space + `last_name` | Never skip |
| Hometown | `city`, `state` (state stays abbreviated, e.g. WA) | Skip if city or state is missing |
| Birthday | `June 8, 1986` (parse ISO datetime, format as Month D, YYYY) | Skip if null |
| Education | Raw string | Skip if null or empty |
| Medals | `Gold: <n>, Silver: <n>, Bronze: <n>` | Skip if all three counts are 0 |
| Sport | One `Sport:` line per entry in the sport list, formatted as `title \| type \| season` | Skip if list is empty |
| Fun_fact | Raw string | Skip if null or empty |
| Biography | HTML stripped to plain text (all tags removed, whitespace collapsed) | Skip if null or empty |

---

## Separator Between Athletes

Exactly **2 blank lines** (i.e., `\n\n\n` — one newline to end the last field, then two more) between every athlete block.

---

## HTML-to-Text Conversion

- Use Python's built-in `html.parser` (no third-party libraries required).
- Remove all HTML tags.
- Collapse consecutive whitespace (spaces, newlines, tabs) into a single space.
- Trim leading/trailing whitespace from the result.
- Do not attempt to preserve document structure (no section headers, no bullets).

---

## Acceptance Criteria

1. Running `python make_athelet_prompt.py` from the `scripts/` directory produces `athelet_sub_prompt.txt` in the same directory.
2. The file contains exactly one block per athlete entry across all JSON files.
3. Athlete blocks appear in file order (numerically sorted), then entry order within each file.
4. Each block contains only the fields that are non-null and non-empty (per the rules above).
5. Exactly 2 blank lines separate consecutive athlete blocks.
6. The Biography field contains no HTML tags.
7. Birthdays are formatted as `Month D, YYYY` (e.g., `June 8, 1986`).
8. If an athlete has multiple sports, each appears on its own `Sport:` line.
9. The script uses only Python standard library modules.

---

## Errors & Edge Cases

| Scenario | Behavior |
|----------|----------|
| JSON file is malformed | Skip the file, print a warning to stderr |
| An entry is missing a top-level key (e.g. `medals`) | Treat it as null/empty, skip that field |
| State field is absent but city is present | Skip Hometown entirely |
| Birthday cannot be parsed | Skip Birthday |
| All medals are 0 | Skip Medals field |
| `sport` list is empty | Skip Sport field |
| Biography is empty string after stripping HTML | Skip Biography |

---

## Out of Scope

- No third-party HTML parsing libraries (e.g. BeautifulSoup, lxml).
- No filtering of athletes by sport, date, or any other criterion.
- No de-duplication of athletes across files.
- No output format other than plain text (no JSON, CSV, Markdown, etc.).
- No command-line arguments or configuration flags.
- No upload or transmission of the output file.
- No image downloading or processing.
