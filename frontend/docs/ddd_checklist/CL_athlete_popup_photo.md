# CL: Show Athlete Photo in City Popup

**Design:** `docs/ddd_design/DES_athlete_popup_photo.md`
**Requirement:** `docs/ddd_requirement/REQ_athlete_popup_photo.md`

---

## Tasks

### Task 1 — Wire thumbnail through backend and add onError fallback in Avatar
**Status:** `completed`
**Files:** `backend/main.py`, `components/CityTooltip.tsx`

**Backend (`backend/main.py`):**
- Extract `thumbnail_image_list` from the athlete entry before `result.append(...)`.
- Add `"thumbnail_image_list": thumbnail_list[:1]` to the dict inside `get_hometowns()`.

**Frontend (`components/CityTooltip.tsx`):**
- Add `useState` to the React import (currently no React import — add `import { useState } from 'react'`).
- In `Avatar`, introduce `const [imgError, setImgError] = useState(false)`.
- Add `onError={() => setImgError(true)}` to the `<img>` element.
- Guard the `<img>` render with `thumbnail && !imgError`; fall through to the initials `<span>` otherwise.

**Expected diff:** ~20 lines across both files.
**Acceptance:** Build passes (`npm run build`); popup shows athlete photos for cities with thumbnailed athletes; athletes without photos show initials; a broken URL falls back to initials with no broken-image icon.
