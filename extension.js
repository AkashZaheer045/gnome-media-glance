// SPDX-License-Identifier: GPL-3.0-or-later
// Media Glance - standalone top-bar music control
//
// Adapted from the media controls of the Kiwi extension
// (https://github.com/kem-a/kiwi-kemma), GPL-3.0.

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { Source } from './lib/mprisPlayer.js';
import { MediaGlanceButton } from './lib/panelControl.js';
import { destroy as destroyServiceIcons } from './lib/serviceIcons.js';

export default class MediaGlanceExtension extends Extension {
    enable() {
        this._source = new Source(this.gettext.bind(this));
        this._button = new MediaGlanceButton(this._source, this.gettext.bind(this));
        // Right box, index 0: the left end of the status area, so the
        // centered clock is never disturbed.
        Main.panel.addToStatusArea('media-glance', this._button, 0, 'right');
        this._source.start();
    }

    disable() {
        // Button first (drops its signal handlers and cards), then the
        // D-Bus source, which tears down every player proxy.
        this._button?.destroy();
        this._button = null;
        this._source?.destroy();
        this._source = null;
        destroyServiceIcons();
    }
}
