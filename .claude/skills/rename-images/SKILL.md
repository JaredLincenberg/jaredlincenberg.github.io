---
name: rename-images
description: Rename freshly uploaded photos in the JaredLincenberg/photos image-host repo from raw camera filenames (IMG_1234.jpeg etc.) to the site's dated naming convention, sort them into a county subfolder, using EXIF date/GPS, reverse geocoding, and iNaturalist observation matching, then add matching entries to _data/photos.yml in this repo. Use when the user says photos were uploaded to the photos repo and need renaming, or asks to add more photos to the site.
---

# Rename Images

Photos for jaredlincenberg.github.io live in a separate image-host repo,
`github.com/JaredLincenberg/photos`. New uploads land at repo root with
raw camera names (`IMG_8321.jpeg`, `DSC_0001.jpeg`, etc. — per that
repo's own upload instructions). This skill renames each one to the
site's convention and files it into a county subfolder:

```
<county-slug>/YYYY-MM-DD-location-description.jpeg
```

`county-slug` is the photo's county, lowercased/hyphenated (e.g.
`jefferson-county`, `denver-county`) — matches `{{ county | slugify }}`
in `_includes/photo-card.html`, so whatever string goes in `photos.yml`'s
`county:` field must slugify to the same folder name actually used in
the photos repo. `location` is a short recognizable place name
(park/trail/neighborhood — e.g. `bar-lake`, `washington-park`).
`description` is a short common name of the subject (singular, e.g.
`bee`, `dragonfly`, `bumble-bee`), matched to the site's existing style
— see `_data/photos.yml` in this repo for the full schema and precedent.

## Storage constraint

The user has limited local disk space. Never download more than one
full-size photo at a time, and never leave a downloaded photo on disk
when you're done with it. Prefer streaming (`curl | exiftool -` /
`curl | base64`) over writing to a file whenever the tool allows reading
from stdin. If you must save a file briefly (e.g. to view it), delete it
immediately after.

## Workflow

1. **Find unprocessed files.** List the photos repo root and diff
   against the keys already in `_data/photos.yml`:
   ```
   gh api repos/JaredLincenberg/photos/contents --jq '.[] | select(.type == "file") | .name'
   ```
   New uploads land at root, so `type == "file"` filters out the county
   folders. Anything left that isn't `README.md`/`LICENSE` needs
   renaming and filing into a county folder.

2. **Pull EXIF without saving the file:**
   ```
   curl -s https://raw.githubusercontent.com/JaredLincenberg/photos/main/<file> \
     | exiftool -DateTimeOriginal -GPSLatitude# -GPSLongitude# -ImageWidth -ImageHeight -OffsetTimeOriginal -fast -
   ```
   `DateTimeOriginal` + `OffsetTimeOriginal` is the local capture time —
   use it as-is for the `datetime` field.

3. **Reverse-geocode the GPS coordinates** for a location name and
   county. Request `addressdetails=1` so the county comes back in the
   same call:
   ```
   curl -s "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=<lat>&lon=<lon>&zoom=18&addressdetails=1" \
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

   For county, use `address.county` from the response. Colorado has
   several consolidated city-and-county governments (Denver, Broomfield,
   and others) where Nominatim returns `address.city` with no separate
   `county` key at all — in that case the city name *is* the county
   (e.g. `city: "Denver"` → county is "Denver County"). The folder this
   photo goes in is `{{ county | slugify }}` (Jekyll's `slugify`, e.g.
   "Jefferson County" → `jefferson-county`) — check whether that county
   already has a folder in the photos repo before assuming a new one:
   ```
   gh api repos/JaredLincenberg/photos/contents --jq '.[] | select(.type == "dir") | .name'
   ```

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
   (old name → new folder/new name, location, county, description,
   observation link) with the user before touching anything — this repo
   is public and renames go straight to git history.

   At this same confirmation step, **ask if any tags apply, comma
   separated.** This should be rare — most photos get none — but things
   like a trip or a specific outing (`yellowstone-trip`, `2026-family-
   reunion`) are the kind of thing worth asking about, since they cut
   across location/date and wouldn't otherwise be captured. Leave the
   `tags:` field off entirely for photos with no tags; don't ask again
   if the user's already said "no tags" earlier in the same batch.

6. **Rename/file the photo in the photos repo via the Git Data API** —
   do **not** `git clone` that repo; cloning it has hung/timed out in
   this sandbox, and the Contents API's PUT+DELETE re-uploads the full
   base64-encoded image for a move that doesn't actually change its
   bytes. Git blobs are content-addressed, so a rename or a folder move
   can reuse the existing blob SHA at a new path — zero image bytes
   transferred. **Build nested paths explicitly** — don't rely on a
   single flat `tree` array with slash-containing paths to auto-create
   subfolders; that behavior isn't verified here, and getting it wrong
   on a public repo is expensive to debug. The explicit approach, proven
   in the county migration:
   ```bash
   HEAD_SHA=$(gh api repos/JaredLincenberg/photos/git/refs/heads/main --jq '.object.sha')
   ROOT_TREE_SHA=$(gh api repos/JaredLincenberg/photos/git/commits/$HEAD_SHA --jq '.tree.sha')
   ```
   - **New county folder:** build its subtree directly —
     `POST git/trees` with `tree: [{"path": new_filename, "mode": "100644", "type": "blob", "sha": existing_blob_sha}, ...]`
     for every file going into that folder (no `base_tree` needed, it's
     new). Note the returned subtree `sha`.
   - **Existing county folder gaining a file:** first `GET
     git/trees/<existing-subtree-sha>` to see what's already there, then
     `POST git/trees` with `base_tree: <existing-subtree-sha>` and just
     the new file's entry, to get the updated subtree `sha`.
   - **Root tree:** `POST git/trees` with `base_tree: ROOT_TREE_SHA` and
     entries removing every old root-level path (`{"path": old_name,
     "sha": null}`) plus one entry per touched county folder
     (`{"path": county-slug, "mode": "040000", "type": "tree", "sha":
     <that folder's subtree sha>}` — new or updated, same syntax either
     way).
   - **Commit + ref:** `POST git/commits` with the new root tree sha and
     `parents: [HEAD_SHA]`, then `PATCH git/refs/heads/main` with the
     resulting commit sha.

   Batch every file from the current run into this single tree/commit
   rather than one API round-trip per file — moving 14 files this way
   took one commit, not fourteen.

7. **Add a matching entry to `_data/photos.yml`** in this repo, following
   the existing schema: `location`, `county` (right after `location` —
   must be spelled so `| slugify` matches the actual photos-repo folder,
   e.g. `Denver County` → `denver-county`), `width`, `height`,
   `description`, `datetime` (quoted `"YYYY-MM-DD HH:MM:SS"`), `lat`/
   `lon` (7 decimal places), `alt` (`"A <description lowercase> at/in
   <location>"`), `caption: ""`, `observation` (iNaturalist URL, if
   matched), `related_observations` (list, only if there are several for
   one subject), `tags` (list, only if the user gave any in step 5 —
   e.g. `tags: [yellowstone-trip]`), and `highlight: true` only if asked
   to feature the photo — omit it otherwise (recent entries default to
   unhighlighted).

8. **Validate before pushing:**
   ```
   python3 -c "import yaml; d=yaml.safe_load(open('_data/photos.yml')); print(len(d))"
   ```
   and confirm that count matches the file count in the photos repo.

9. **Commit and push both repos.** Both are public/shared state, so this
   is worth a quick explicit go-ahead from the user if it wasn't already
   given as part of the original request.
