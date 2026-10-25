# Releasing Media Glance

How new versions reach users through **extensions.gnome.org** (EGO).

## The honest flow

```
bump version  ->  GitHub Release  ->  CI packs + uploads to EGO  ->  HUMAN REVIEW  ->  live  ->  users auto-update
```

- EGO reviews **every** version by a human. First submissions usually get change
  requests; reviews take **days to weeks**. The CI only puts a version in the
  **review queue** — it does not publish it.
- Once a version is **approved**, every user's GNOME (Extension Manager / the
  Extensions app) sees it and updates automatically. That is the real benefit.
- EGO has **no API tokens**; uploads use your account username + password.

## One-time setup

1. **Create an EGO account** at https://extensions.gnome.org/accounts/register/.
2. **First submission is manual.** Pack locally and upload by hand so you see the
   reviewer's feedback:
   ```bash
   gnome-extensions pack . --force \
     --extra-source=lib --extra-source=icons --extra-source=prefs.js --extra-source=LICENSE \
     -o .
   ```
   Then upload `mediaglance@akashzaheer045.github.com.shell-extension.zip` at
   https://extensions.gnome.org/upload/.
3. **Add repository secrets** for the CI
   (GitHub → repo → Settings → Secrets and variables → Actions → *New repository secret*):
   - `EGO_USER` — your EGO username (or the email you registered with)
   - `EGO_PASSWORD` — that account's password

## Cutting a release (after setup)

1. Bump `version` (and `version-name`) in `metadata.json`. EGO requires the integer
   `version` to **increase** on every upload.
2. Commit and push.
3. Create a GitHub Release (tag like `v0.2.0`).
4. The **Upload to extensions.gnome.org** workflow runs, packs, and uploads.
5. Watch the Actions log; then watch your EGO dashboard for the review result.

You can also trigger the workflow by hand from the **Actions** tab
(*Upload to extensions.gnome.org* → *Run workflow*).

## Review gotchas to expect

- **Brand icons:** the bundled YouTube / Spotify / SoundCloud / Apple Music logos may
  be flagged on trademark grounds. If so, replace them with generic/service-neutral
  glyphs for the EGO build.
- **GPL / attribution:** code is adapted from the Kiwi extension (GPL-3.0); keep the
  attribution in source headers and README.
- **Review rules:** no stray logging, clean `disable()` teardown (no leaked sources,
  timeouts, or signal handlers), and no running code at import time.
