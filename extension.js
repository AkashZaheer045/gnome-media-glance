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

const VALID_BOXES = ['left', 'center', 'right'];

export default class MediaGlanceExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._source = new Source(this.gettext.bind(this));
        this._source.start();
        this._place();
        // Re-place the button when the user changes position/index in prefs.
        this._positionId = this._settings.connect('changed::panel-position',
            () => this._place());
        this._indexId = this._settings.connect('changed::panel-index',
            () => this._place());
    }

    _place() {
        // Destroying the old button also removes it from Main.panel.statusArea,
        // so re-adding under the same role is safe.
        this._button?.destroy();
        this._button = new MediaGlanceButton(this._source, this.gettext.bind(this));

        let box = this._settings.get_string('panel-position');
        if (!VALID_BOXES.includes(box))
            box = 'right';
        const index = this._settings.get_int('panel-index');
        Main.panel.addToStatusArea('media-glance', this._button, index, box);
    }

    disable() {
        if (this._settings) {
            if (this._positionId)
                this._settings.disconnect(this._positionId);
            if (this._indexId)
                this._settings.disconnect(this._indexId);
        }
        this._positionId = null;
        this._indexId = null;
        this._settings = null;
        // Button first (drops its signal handlers and cards), then the
        // D-Bus source, which tears down every player proxy.
        this._button?.destroy();
        this._button = null;
        this._source?.destroy();
        this._source = null;
        destroyServiceIcons();
    }
}
