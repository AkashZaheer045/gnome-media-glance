# Media Glance — GNOME Shell extension design

**Date:** 2026-10-26
**Author:** Akash (AkashZaheer045), with Claude
**Status:** Draft for approval

## Intent / why

Akash likes the music control UI of the **Kiwi (is not Apple)** GNOME extension but
does not want the rest of Kiwi (panel/dock/window-management features). In Kiwi the
media control is also hard-coupled to the "Move Calendar to Right" feature, so it
cannot be kept while the clock stays centered. The goal is a small, standalone
extension — owned by Akash, in his own GitHub repo — that reproduces *only* Kiwi's
music control, decoupled from everything else, so he can run just that one thing and
keep his panel otherwise vanilla (clock centered).

## Goals

- A top-bar media control that appears only when something is actually playing.
- Reproduce Kiwi's music UI look (buttons, seek slider, soundwave, scrolling title,
  artwork) as closely as possible — reuse Kiwi's CSS so it is a visual match.
- Standalone: no dependency on Kiwi; does not touch clock position, dock, or windows.
- Show the **service's** icon (YouTube, Spotify, SoundCloud, …) in the panel rather
  than the browser's icon when audio plays from a browser tab. Best-effort.

### Top bar (glanceable, icons only — no track text)
- Service icon (detected), then three control buttons: **Previous · Play/Pause · Next**.
- No song title / artist text in the panel ("not the lyrics in the top bar").
- Hidden entirely when no MPRIS player is active.

### Popup (click the panel item) — one card per active player, matching Kiwi
- Album artwork (with a generic placeholder when none).
- Scrolling track title (marquee when it overflows).
- Artist line with the animated soundwave bars.
- Controls row: Previous · Play/Pause · Next.
- **Seek slider** ("adjust the track level" = position in the track, not volume) with
  elapsed / remaining time labels; draggable to scrub.

## Non-goals

- Volume control (the slider is track position, not volume).
- Lyrics, equalizer, playlist/queue management, or any settings UI beyond what is
  needed (v1 can ship with no preferences window at all).
- Theming other apps, panel transparency, dock, window controls — none of Kiwi's
  other features.
- Perfect service detection for every obscure site.

## Anti-goals (what makes it a failure even if it "works")

- Pulling in Kiwi code wholesale or depending on Kiwi being installed.
- Changing the clock position or any unrelated panel element.
- Showing the browser icon (Firefox/Chrome) when the real source is YouTube/Spotify —
  that is the specific annoyance this fixes.
- Heavy runtime cost. This machine is RAM-constrained and tuned RAM-first; the
  extension must stay light (no polling storms, no heavy background work).

## Constraints / context

- Target: GNOME Shell **50/51** (dev machine is 50.1); declare 48–51 for portability.
- Language: modern ESM GNOME Shell extension JavaScript (GJS), same style as Kiwi.
- Media data source: **MPRIS2 over D-Bus** (`org.mpris.MediaPlayer2.*`), the standard
  GNOME mechanism Kiwi itself uses.
- License: GPL-3.0-or-later (Kiwi is GPL-3.0; reusing its CSS/approach requires this).
  Attribution to the Kiwi project in the README and source headers.
- Must not conflict with other installed media extensions (mediacontrols@cliffniff,
  dropbeat, etc.) — Akash can disable those himself; this one stands alone.

## Decided "how" (Claude's calls unless Akash overrides)

- **Repo / project name:** `gnome-media-glance`, under `~/Projects/`.
- **Extension UUID:** `mediaglance@akashzaheer045.github.com`.
- **Display name:** "Media Glance".
- **Icon set:** bundle a small set of monochrome-friendly service logos (YouTube,
  Spotify, SoundCloud, YouTube Music, Apple Music, generic) under `icons/`.
- **Service detection order:** (1) track URL/metadata domain (xesam:url, art URL host)
  → map to a service; (2) MPRIS player identity / bus name (e.g. real Spotify app);
  (3) generic music-note fallback.
- **No preferences window in v1** — fewer moving parts; can add later.
- **Published to GitHub** as a public repo under AkashZaheer045 via SSH (already set up).
- **Obsidian / graphify:** skipped (Akash did not request them; keeps it lean).

## Resolved after builder review (Claude's calls)

- **Panel position:** place the item on the **right**, at the *left end of the status
  area* (before the system indicators), so it never disturbs the centered clock.
- **Visibility:** show whenever at least one MPRIS player **exists** (Playing *or*
  Paused); hide only when none exist — so you can resume/scrub from the panel.
  (This refines the earlier "only when playing" wording.)
- **Which player drives the panel icon/buttons when several exist:** the **most
  recently active** player (last to change playback state), same convention as
  GNOME's own media section. The popup still lists all of them.
- **Kiwi reuse:** read Kiwi's source from its local install path
  (`~/.local/share/gnome-shell/extensions/kiwi@kemma`) and adapt its CSS and
  media/MPRIS logic — adapted, not copied blind.
- **Unknown web source fallback icon:** a **generic music note**, never the browser
  icon (per the anti-goal).

## What's left to the builder

- Exact MPRIS proxy wiring, play/pause/seek handlers, and position tracking (can be
  modeled on Kiwi's `mediaPlayback.js`, adapted/trimmed, not copied blindly).
- The precise CSS subset to lift from Kiwi's `stylesheet.css` for the media classes.
- Marquee/scroll animation for the title and the soundwave animation timing.
- The service→icon mapping table and the bundled icon assets.
- Multi-player handling in the popup (Kiwi shows up to 3; builder may keep or simplify).
- README with install steps, attribution, and a screenshot.
