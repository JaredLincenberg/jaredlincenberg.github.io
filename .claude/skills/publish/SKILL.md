---
name: publish
description: Use when changes to this Jekyll blog (jaredlincenberg.github.io) are ready to ship — ready to build, verify, commit, merge, and confirm the live GitHub Pages site actually updated. Not for mid-draft work.
---

# Publish

Builds, verifies, and ships changes to the live site. Every commit so far
has landed on `main` directly, but the documented convention (see
README's Branching section) is a short-lived `post/<slug>` branch merged
straight back into `main` — no PR. There's no GitHub Actions workflow;
GitHub Pages builds automatically from `main` once pushed.

## Workflow

1. **Build in the foreground — don't trust exit code alone.**
   ```
   bundle exec jekyll build
   ```
   A clean build ends with `done in Xs.` and nothing else unexpected.
   Scan the full output for `error`/`warning` (case-insensitive). A
   backgrounded install/build has silently reported exit 0 here while
   actually failing before — run this in the foreground and read the
   text, don't just check `$?`.

2. **Check for broken photo references.**
   ```bash
   grep -rohE 'filename="[^"]*"' _field_notes/*.md *.md 2>/dev/null \
     | sed -E 's/filename="//;s/"$//' | sort -u \
     | while IFS= read -r f; do grep -Fxq "${f}:" _data/photos.yml || echo "BROKEN PHOTO REF: $f"; done
   ```
   Photos live in a separate repo (`JaredLincenberg/photos`) and resolve
   through `_data/photos.yml` via `{% include photo-embed.html
   filename="..." %}` — there's no literal `assets/` path to grep for.
   Any output here is a post referencing a filename with no matching
   `photos.yml` entry (this is exactly how the broomfield-bee embed
   broke after a rename).

3. **Show a diff summary and confirm.**
   ```
   git status --short
   git diff --stat
   ```
   Show both to the user and wait for explicit go-ahead before
   committing — this repo is public.

4. **Commit on a `post/<slug>` branch, merge to `main` directly, push.**
   ```bash
   git checkout -b post/<slug>   # skip if already on one mid-work
   git add <files>
   git commit -m "..."
   git checkout main
   git merge post/<slug>
   git branch -d post/<slug>
   git push origin main
   ```
   No PR — the branch isolates the working commit(s) locally, not for
   remote review.

5. **After push, confirm the live site actually caught up — don't
   declare done at push time.**
   ```bash
   git rev-parse HEAD
   gh api repos/JaredLincenberg/jaredlincenberg.github.io/pages/builds/latest --jq '{status, commit}'
   ```
   Poll until `commit` matches the SHA you just pushed and `status` is
   `"built"` (builds have taken well under a minute historically). Then:
   ```bash
   curl -s https://jaredlincenberg.github.io/<path> | grep -n '<expected marker>'
   curl -s https://jaredlincenberg.github.io/assets/css/main.css | grep -n '<expected rule>'
   ```
   Grep for the specific selector/text that changed, not just "page
   loads" — a prior CSS specificity bug (hardcoded `main p`/`main ul`
   font-size overriding the scalable em base) shipped and would have
   passed a shallow "site is up" check, since the page rendered fine
   with just the wrong rule winning. Confirm no earlier rule overrides
   yours.

## Common mistakes

| Mistake | Why it bites |
|---|---|
| Backgrounding the jekyll build | Reported exit 0 once while actually failing — read foreground output, not just the exit code. |
| Checking for `assets/...` image paths | This repo's photos resolve through `_data/photos.yml`, not literal asset paths — use step 2's filename check instead. |
| Calling it shipped at `git push` | Pages build lags the push — verify `pages/builds/latest` and grep the live page/CSS before confirming to the user. |
| Opening a PR | Doesn't match this repo's workflow — branch, merge locally, push `main`. |
