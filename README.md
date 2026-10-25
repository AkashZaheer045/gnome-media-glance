# Media Glance

A small, standalone GNOME Shell extension that puts a music control in the top bar.

- **Panel:** the streaming service's icon (YouTube, YouTube Music, Spotify, SoundCloud,
  Apple Music, or a generic music note), followed by previous / play-pause / next buttons.
  No track text. The item is hidden when no MPRIS player exists and stays visible while
  a player is playing or paused. It sits at the left end of the right-hand status area,
  so the centered clock is untouched. With several players, the most recently active one
  drives the panel.
- **Popup (click the icon):** one card per player with artwork, a scrolling title, the artist
  with animated soundwave bars, transport controls, and a track-position seek slider with
  elapsed / remaining time. The slider is dimmed and inert for players that cannot seek.

Browsers are never shown as the source: web audio is identified by track/artwork URL,
and anything unrecognised falls back to the generic music note.

Supports GNOME Shell 48, 49, 50 and 51. Media data comes from MPRIS2 over D-Bus.

## Install

```sh
git clone https://github.com/AkashZaheer045/gnome-media-glance.git
cd gnome-media-glance
mkdir -p ~/.local/share/gnome-shell/extensions
ln -s "$PWD" ~/.local/share/gnome-shell/extensions/mediaglance@akashzaheer045.github.com
glib-compile-schemas schemas/
gnome-extensions enable mediaglance@akashzaheer045.github.com
```

On Wayland, log out and back in first so GNOME Shell discovers the extension.
To build an installable zip instead: `gnome-extensions pack . --force --extra-source=lib --extra-source=icons`

## Credits and license

The MPRIS player layer, popup media card and styling are adapted from the media controls of
[Kiwi (is not Apple)](https://github.com/kem-a/kiwi-kemma) by kem-a, which is licensed under
GPL-3.0. Media Glance reuses that work under the same terms and is licensed
**GPL-3.0-or-later** (see `LICENSE`). Service logos in `icons/` are simple hand-drawn
approximations for personal use; the brands belong to their owners.

## Layout

```
extension.js          enable()/disable() wiring
lib/mprisPlayer.js    MPRIS Player / Source (adapted from Kiwi)
lib/serviceIcons.js   player -> service icon detection
lib/panelControl.js   top-bar button and popup list
lib/mediaCard.js      popup card, marquee title, seek slider
icons/                symbolic service icons
```
