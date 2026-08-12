---
name: rename-images
description: Rename freshly uploaded photos in the JaredLincenberg/photos image-host repo from raw camera filenames (IMG_1234.jpeg etc.) to the site's dated naming convention, using EXIF date/GPS, reverse geocoding, and iNaturalist observation matching, then add matching entries to _data/photos.yml in this repo. Use when the user says photos were uploaded to the photos repo and need renaming, or asks to add more photos to the site.
---

# Rename Images

Photos for jaredlincenberg.github.io live in a separate image-host repo,
`github.com/JaredLincenberg/photos` (root-level files, not an `images/`
subfolder — ignore that repo's own README, which is stale on this point).
Files land there with raw camera names (`IMG_8321.jpeg`, `DSC_0001.jpeg`,
etc.) and need renaming to the convention used everywhere else:

```
YYYY-MM-DD-location-description.jpeg
```

All lowercase, hyphen-separated, no punctuation. `location` is a short
recognizable place name (park/trail/neighborhood — e.g. `bar-lake`,
`washington-park`). `description` is a short common name of the subject
(singular, e.g. `bee`, `dragonfly`, `bumble-bee`), matched to the site's
existing style — see `_data/photos.yml` in this repo for the schema and
precedent.

## Storage constraint

The user has limited local disk space. Never download more than one
full-size photo at a time, and never leave a downloaded photo on disk
when you're done with it. Prefer streaming (`curl | exiftool -` /
`curl | base64`) over writing to a file whenever the tool allows reading
from stdin. If you must save a file briefly (e.g. to view it), delete it
immediately after.

## Workflow

1. **Find unprocessed files.** List the photos repo and diff against the
   keys already in `_data/photos.yml`:
   ```
   gh api repos/JaredLincenberg/photos/contents --jq '.[].name'
   ```
   Anything not matching `YYYY-MM-DD-*` (and not `README.md`/`LICENSE`)
   needs renaming.

2. **Pull EXIF without saving the file:**
   ```
   curl -s https://raw.githubusercontent.com/JaredLincenberg/photos/main/<file> \
     | exiftool -DateTimeOriginal -GPSLatitude# -GPSLongitude# -ImageWidth -ImageHeight -OffsetTimeOriginal -fast -
   ```
   `DateTimeOriginal` + `OffsetTimeOriginal` is the local capture time —
   use it as-is for the `datetime` field.

3. **Reverse-geocode the GPS coordinates** for a location name:
   ```
   curl -s "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=<lat>&lon=<lon>&zoom=18" \
     -A "personal-site-photo-tool/1.0 (jaredlincenberg@gmail.com)"
   ```
   If the result is just a street/road (common), search nearby for a
   named landmark instead:
   ```
   curl -s "https://nominatim.openstreetmap.org/search?format=jsonv2&q=park&bounded=1&viewbox=<minlon>,<minlat>,<maxlon>,<maxlat>" -A "..."
   ```
   **Reverse geocoding guesses wrong sometimes** (it once returned "Aylor
   Open Space" for what was actually "Anythink Nature Library" next
   door) — always show the proposed location name to the user before
   finalizing rather than assuming it's correct.

4. **Match to an iNaturalist observation** (for the `observation:`
   field and a confident description). Query observations for that day:
   ```
   curl -s "https://api.inaturalist.org/v1/observations?user_login=jared_lincenberg&d1=<date>&d2=<date>&order=asc&order_by=observed_on&per_page=50"
   ```
   Look for a result whose GPS matches the photo to ~5 decimal places
   and whose `time_observed_at` is within about a minute of the photo's
   `DateTimeOriginal` — EXIF timestamps can drift up to a minute from
   what iNaturalist logged. Fetch the full record for the taxon name:
   ```
   curl -s https://api.inaturalist.org/v1/observations/<id>
   ```
   Use `taxon.preferred_common_name` (fall back to a plain-language
   version of `taxon.name` if there's no common name) as the
   `description`.

   **If nothing matches confidently by time/GPS, don't guess — hand it
   back to the user.** Viewing the image costs real tokens (a 2048×1536
   photo is ~2,500 tokens just to encode, before any reasoning) and a
   visual guess is routinely wrong or gets overridden anyway once the
   user checks iNaturalist themselves. Instead, report three things and
   stop:
   - **Image name** — the raw filename in the photos repo.
   - **Location** — the reverse-geocoded place name from step 3.
   - **A pre-scoped iNaturalist search link**, built as the observed
     time ± 1 hour so the user can eyeball their own observations list
     and pick the right one in seconds:
     ```python
     from datetime import datetime, timedelta
     from urllib.parse import quote

     # dt = DateTimeOriginal + OffsetTimeOriginal, e.g. "2026-08-09T19:53:16-06:00"
     dt = datetime.fromisoformat("2026-08-09T19:53:16-06:00")
     d1 = quote((dt - timedelta(hours=1)).isoformat())
     d2 = quote((dt + timedelta(hours=1)).isoformat())
     url = f"https://www.inaturalist.org/observations?user_id=jared_lincenberg&verifiable=any&d1={d1}&d2={d2}"
     ```

   Then wait for one of:
   - an **observation URL** — fetch it and proceed as if matched above;
   - a **description** — use it directly, no `observation:` link;
   - **"pass" / "later"** — skip this file for now and move to the next
     one. No state tracking is needed for this: a skipped file simply
     keeps its camera filename in the photos repo, so it will show back
     up automatically the next time step 1 runs — whether that's later
     in the same session or a fresh one.

   Only fall back to actually viewing the image yourself if the user
   explicitly asks you to guess (e.g. "I don't know, take a look") —
   treat it as an opt-in last resort, not the default path, given the
   token cost and its track record of being overridden.

5. **Build the new filename** and confirm the full proposed mapping
   (old name → new name, location, description, observation link) with
   the user before touching anything — this repo is public and renames
   go straight to git history.

6. **Rename in the photos repo via the Contents API** — do **not**
   `git clone` that repo; cloning it has hung/timed out in this sandbox.
   For each file:
   ```bash
   curl -s https://raw.githubusercontent.com/JaredLincenberg/photos/main/<old> | base64 -w0 > b64.txt
   python3 -c "import json; json.dump({'message': 'Rename <old> to <new>', 'content': open('b64.txt').read()}, open('payload.json','w'))"
   gh api --method PUT repos/JaredLincenberg/photos/contents/<new> --input payload.json
   gh api --method DELETE repos/JaredLincenberg/photos/contents/<old> -f message="Remove <old> (renamed to <new>)" -f sha=<sha-from-step-1-listing>
   rm -f b64.txt payload.json
   ```

7. **Add a matching entry to `_data/photos.yml`** in this repo, following
   the existing schema: `location`, `width`, `height`, `description`,
   `datetime` (quoted `"YYYY-MM-DD HH:MM:SS"`), `lat`/`lon` (7 decimal
   places), `alt` (`"A <description lowercase> at/in <location>"`),
   `caption: ""`, `observation` (iNaturalist URL, if matched),
   `related_observations` (list, only if there are several for one
   subject), and `highlight: true` only if asked to feature the photo —
   omit it otherwise (recent entries default to unhighlighted).

8. **Validate before pushing:**
   ```
   python3 -c "import yaml; d=yaml.safe_load(open('_data/photos.yml')); print(len(d))"
   ```
   and confirm that count matches the file count in the photos repo.

9. **Commit and push both repos.** Both are public/shared state, so this
   is worth a quick explicit go-ahead from the user if it wasn't already
   given as part of the original request.
