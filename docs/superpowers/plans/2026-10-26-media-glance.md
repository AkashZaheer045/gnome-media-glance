# Media Glance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A standalone GNOME Shell extension that puts a Kiwi-style music control (service icon + prev/play-pause/next in the panel, full card with seek slider in the popup) in the top bar, decoupled from Kiwi.

**Architecture:** An MPRIS2/D-Bus player layer (adapted from Kiwi's `mediaPlayback.js`) feeds a panel `PanelMenu.Button`. The button shows a service icon + three control buttons; its popup lists one Kiwi-style media card per active player. A service-detection helper maps player identity / track URL → a bundled service icon. CSS for the card is lifted from Kiwi's stylesheet.

**Tech Stack:** GJS (ESM), GNOME Shell 48–51 API, MPRIS2 over GDBus, GSettings schema (minimal/optional), `glib-compile-schemas`, `gnome-extensions`.

**Spec:** `docs/superpowers/specs/2026-10-26-media-glance-design.md` (design doc; travels with this plan).

## Global Constraints

- Target GNOME Shell `48`, `49`, `50`, `51`; dev machine is 50.1. (verbatim from spec)
- ESM extension JS, Kiwi-matching style. License **GPL-3.0-or-later**; attribute Kiwi in README + source headers.
- UUID `mediaglance@akashzaheer045.github.com`; display name "Media Glance"; repo `~/Projects/gnome-media-glance`.
- No dependency on Kiwi at runtime; must not alter clock position, dock, or windows.
- Panel item on the **right**, at the left end of the status area (never crowd centered clock).
- Service icon never the browser icon; unknown web source → generic music note.
- Light on RAM: no busy polling; drive position updates only while a card popup is mapped (as Kiwi does).

## Review Focus

- **No players at all / all closed:** panel item must be fully hidden (not an empty button). → Task 3 check.
- **Paused player:** item stays visible and play button resumes it (not hidden). → Task 3 check.
- **Browser with no `xesam:url` (Firefox blob art):** falls back to music note, never Firefox icon. → Task 2 check.
- **Player that can't seek (`CanSeek=false`):** slider is disabled/non-draggable, no crash. → Task 4 check.
- **Multiple simultaneous players (e.g. Spotify + YouTube):** panel follows most-recently-active; popup lists both. → Task 3 check.

---

### Task 1: Repo scaffold + MPRIS player layer

**Files:**
- Create: `~/Projects/gnome-media-glance/metadata.json`, `LICENSE` (GPL-3.0), `README.md`, `.gitignore`
- Create: `lib/mprisPlayer.js` (adapted from Kiwi `apps/mediaPlayback.js`: `Player`, `Source`, MPRIS D-Bus proxies, position tracking, `formatTime`)
- Create: `docs/superpowers/specs/2026-10-26-media-glance-design.md`, `docs/superpowers/plans/2026-10-26-media-glance.md` (move these two files in)

**Interfaces:**
- Produces: `class Source` (signals `player-added`/`player-removed`, `start()`, `destroy()`); `class Player` (props `trackTitle`, `trackArtists`, `artUrl`, `xesamUrl`, `identity`, `busName`, `status`, `canGoNext/Previous`, `canSeek`, `position`; methods `playPause()`, `next()`, `previous()`, `seek(µs)`; signals `changed`, `seeked`).

- [ ] **Step 1:** Write `metadata.json` with uuid/name/description/shell-version `["48","49","50","51"]`/url/version 1/`settings-schema` (even if unused v1) and `gettext-domain`.
- [ ] **Step 2:** Adapt Kiwi `apps/mediaPlayback.js` → `lib/mprisPlayer.js`: keep `Player`/`Source`/MPRIS proxy/`formatTime`; drop anything UI-specific; expose `xesamUrl` + `identity` + `busName` getters for service detection.
- [ ] **Step 3 (verify):** `node --check lib/mprisPlayer.js` (ESM import lines commented or use `gjs -c`); confirm no syntax errors. Expected: no output / exit 0.
- [ ] **Step 4:** Commit `feat: scaffold repo + MPRIS player layer`.

### Task 2: Service detection + bundled icons

**Files:**
- Create: `lib/serviceIcons.js`
- Create: `icons/hicolor/scalable/actions/{youtube,spotify,soundcloud,ytmusic,apple-music,generic-music}-symbolic.svg` (or colored where symbolic unavailable)

**Interfaces:**
- Consumes: `Player` (`xesamUrl`, `artUrl`, `identity`, `busName`) from Task 1.
- Produces: `detectService(player) -> { key: string, gicon: Gio.Icon }`.

- [ ] **Step 1:** Implement `detectService`: (1) parse host from `xesamUrl` then `artUrl`; map `youtube.com/music.youtube.com/spotify.com/soundcloud.com/music.apple.com` → key; (2) else match `identity`/`busName` (`spotify`, `chromium`, `firefox`→unknown-web); (3) else `generic`. Browser identity with no recognizable URL → `generic`, never a browser icon.
- [ ] **Step 2:** Add the bundled SVG icons; load via `Gio.icon_new_for_string(ext.path + '/icons/...')`.
- [ ] **Step 3 (verify):** small `gjs` harness calling `detectService` with faked player objects for: youtube url, spotify identity, firefox+blob art (→generic), empty (→generic). Expected: correct keys printed.
- [ ] **Step 4:** Commit `feat: service detection + icons`.

### Task 3: Panel button (icon + prev/play-pause/next, visibility, active-player tracking)

**Files:**
- Create: `lib/panelControl.js`
- Create: `extension.js` (enable/disable wiring)

**Interfaces:**
- Consumes: `Source`/`Player` (Task 1), `detectService` (Task 2).
- Produces: `class MediaGlanceButton extends PanelMenu.Button` with `setActivePlayer(player)`, `refresh()`; added via `Main.panel.addToStatusArea('media-glance', btn, 0, 'right')`.

- [ ] **Step 1:** Build the panel box: service `St.Icon` + three `St.Button`s (`media-skip-backward/`, play/pause toggles `media-playback-start`↔`pause-symbolic`, `media-skip-forward-symbolic`). Wire to active player's `previous/playPause/next`.
- [ ] **Step 2:** Active-player tracking: keep the most-recently-active player (updates on any player's `changed` where status→Playing); button hidden when `Source` has zero players, visible when ≥1 (playing or paused).
- [ ] **Step 3:** `extension.js`: `enable()` creates `Source` + button; `disable()` destroys both and nulls refs (no leaks).
- [ ] **Step 4 (verify):** `gnome-extensions pack` / `glib-compile-schemas schemas` succeed; `node --check` on each JS. Expected: exit 0, no schema errors.
- [ ] **Step 5:** Commit `feat: panel control button + active-player tracking`.

### Task 4: Popup media card (Kiwi-style) + seek slider + CSS

**Files:**
- Create: `lib/mediaCard.js` (adapted from Kiwi `MediaItem` + `MediaProgressSlider`: artwork, scrolling title, artist row + soundwave, controls, seek slider, elapsed/remaining)
- Create: `stylesheet.css` (lift the `kiwi-media*`, `kiwi-track-title`, soundwave, controls, slider rules from Kiwi `stylesheet.css`; rename `kiwi-` → `mg-`)
- Modify: `lib/panelControl.js` (populate `menu` with one card per player; redraw hook)

**Interfaces:**
- Consumes: `Player` (Task 1).
- Produces: `class MediaCard` (one per player) added to the panel button's popup menu.

- [ ] **Step 1:** Port `MediaItem` → `MediaCard`: artwork+placeholder, marquee title, soundwave bars, prev/play-pause/next, `MediaProgressSlider` with elapsed/remaining; position updates only while popup mapped.
- [ ] **Step 2:** `CanSeek=false` → slider `reactive=false`/dimmed, drag is a no-op (no crash).
- [ ] **Step 3:** Port and rename the CSS subset; verify class names match the JS.
- [ ] **Step 4 (verify):** `node --check lib/mediaCard.js`; `gnome-extensions pack` validates bundle. Expected: exit 0.
- [ ] **Step 5:** Commit `feat: popup media card with seek slider + styling`.

### Task 5: Install, live-load check, GitHub publish

**Files:** none new.

- [ ] **Step 1:** Symlink/copy repo → `~/.local/share/gnome-shell/extensions/mediaglance@akashzaheer045.github.com`; `glib-compile-schemas schemas/`.
- [ ] **Step 2 (verify):** `gnome-extensions enable mediaglance@akashzaheer045.github.com`; check `journalctl /usr/bin/gnome-shell -b -o cat | grep -i mediaglance` for load errors after a (user-performed) relogin. Document that Wayland needs logout/login; I report the pre-login validation and the command for the user to confirm post-login.
- [ ] **Step 3:** `gh repo create AkashZaheer045/gnome-media-glance --public --source=. --remote=origin --push` (SSH). Add README with install steps + Kiwi attribution + screenshot placeholder.
- [ ] **Step 4:** Commit any final docs; confirm `git push` succeeded and print the repo URL.

## Self-Review notes

- Spec coverage: panel (T3), popup+seek (T4), service icon not browser (T2), decoupled/standalone (T1 metadata, no Kiwi import), publish+install (T5). Covered.
- GNOME extensions have no real unit-test harness; verification is static (parse/compile/pack) + one live load. Stated honestly; not fabricating pytest-style behavior tests.
- Proportion: plan references Kiwi source to adapt rather than transcribing ~1100 lines of code. OK.
