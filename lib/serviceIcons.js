// SPDX-License-Identifier: GPL-3.0-or-later
// Media Glance - map an MPRIS player to a streaming-service icon
//
// Original to Media Glance; part of an extension adapted from Kiwi
// (https://github.com/kem-a/kiwi-kemma), GPL-3.0.

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

// icons/ directory, resolved relative to this module (lib/ -> ../icons).
const ICON_DIR = Gio.File.new_for_uri(import.meta.url)
    .get_parent().get_parent().get_child('icons');

// Ordered: the more specific host must come before its parent domain.
const HOST_RULES = [
    ['music.youtube.com', 'ytmusic'],
    ['youtube.com', 'youtube'],
    ['youtu.be', 'youtube'],
    ['googlevideo.com', 'youtube'],
    ['ytimg.com', 'youtube'],
    ['open.spotify.com', 'spotify'],
    ['spotify.com', 'spotify'],
    ['scdn.co', 'spotify'],
    ['soundcloud.com', 'soundcloud'],
    ['sndcdn.com', 'soundcloud'],
    ['music.apple.com', 'apple-music'],
    ['mzstatic.com', 'apple-music'],
];

// Native apps identified by MPRIS identity / bus name. Browsers are
// deliberately absent: with no recognizable URL they fall back to generic.
const APP_RULES = [
    ['spotify', 'spotify'],
    ['soundcloud', 'soundcloud'],
    ['youtube music', 'ytmusic'],
    ['youtube-music', 'ytmusic'],
    ['apple music', 'apple-music'],
];

const iconCache = new Map();

function _hostOf(url) {
    if (typeof url !== 'string' || !url)
        return null;
    try {
        const uri = GLib.Uri.parse(url, GLib.UriFlags.NONE);
        return uri.get_host()?.toLowerCase() ?? null;
    } catch {
        return null;
    }
}

function _keyFromHost(host) {
    if (!host)
        return null;
    for (const [domain, key] of HOST_RULES) {
        if (host === domain || host.endsWith(`.${domain}`))
            return key;
    }
    return null;
}

function _keyFromApp(player) {
    const haystack = `${player.identity ?? ''} ${player.busName ?? ''}`.toLowerCase();
    for (const [needle, key] of APP_RULES) {
        if (haystack.includes(needle))
            return key;
    }
    return null;
}

function _gicon(key) {
    let icon = iconCache.get(key);
    if (!icon) {
        icon = new Gio.FileIcon({ file: ICON_DIR.get_child(`${key}-symbolic.svg`) });
        iconCache.set(key, icon);
    }
    return icon;
}

export function detectService(player) {
    const key = _keyFromHost(_hostOf(player?.xesamUrl)) ??
        _keyFromHost(_hostOf(player?.artUrl)) ??
        (player ? _keyFromApp(player) : null) ??
        'generic-music';
    return { key, gicon: _gicon(key) };
}

export function destroy() {
    iconCache.clear();
}
