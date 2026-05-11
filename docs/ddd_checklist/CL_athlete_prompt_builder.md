# CL: Athlete Prompt Builder

Design doc: `docs/ddd_design/DES_athlete_prompt_builder.md`
Requirements: `docs/ddd_requirement/REQ_athlete_prompt_builder.md`

---

## Tasks

### Task 1 — Implement `make_athelet_prompt.py` · `completed`

**File:** `scripts/make_athelet_prompt.py`

Implement the complete script as designed. All helper functions are under 50 lines individually and form a single coherent unit, so they ship together.

**Functions to implement (in order):**

1. `strip_html(html_text: str) -> str`  
   Regex-strip tags → unescape HTML entities → collapse whitespace. Returns `""` for falsy input.

2. `format_date(iso_str: str) -> str | None`  
   Parse `"1986-06-08T00:00:00"` → `"June 8, 1986"`. Returns `None` on `ValueError`.

3. `format_athlete(entry: dict) -> str`  
   Assemble labeled field lines in the specified order (Name, Hometown, Birthday, Education, Medals, Sport×N, Fun_fact, Biography). Skip null/empty fields per rules. Return `"\n".join(lines)`.

4. `load_entries(path: Path) -> list[dict]`  
   Read JSON, return `data["entries"]`. On `JSONDecodeError` or `OSError`: warn to `stderr`, return `[]`.

5. `main() -> None`  
   Glob `process_jsons/athletes_*.json`, sort numerically by embedded number, collect one block per athlete, write `"\n\n\n".join(blocks)` to `athelet_sub_prompt.txt`.

**Imports:** `html`, `json`, `re`, `sys`, `datetime.datetime`, `pathlib.Path`

**Expected diff:** ~80 lines
