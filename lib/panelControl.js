// SPDX-License-Identifier: GPL-3.0-or-later
// Media Glance - top-bar button: service icon + previous / play-pause / next
//
// Adapted from the Kiwi extension (https://github.com/kem-a/kiwi-kemma,
// apps/panelMedia.js), GPL-3.0. Unlike Kiwi, the panel shows controls only
// (no track text) and does not move the calendar/clock.

import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import { MediaCard } from './mediaCard.js';
import { detectService } from './serviceIcons.js';

const DISABLED_OPACITY = 110;

export class MediaGlanceButton extends PanelMenu.Button {
    constructor(source, gettext) {
        super(0.5, gettext('Media Glance'));
        this._source = source;
        this._cards = new Map();
        this._lastStatus = new Map();
        this._activePlayer = null;
        this._serviceKey = null;
        this.visible = false;

        const box = new St.BoxLayout({
            style_class: 'mg-panel-box',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this._serviceIcon = new St.Icon({
            style_class: 'system-status-icon mg-service-icon',
            y_align: Clutter.ActorAlign.CENTER,
        });
        box.add_child(this._serviceIcon);
        this._prevButton = this._addButton(box, 'media-skip-backward-symbolic',
            () => this._activePlayer?.previous());
        this._playButton = this._addButton(box, 'media-playback-start-symbolic',
            () => this._activePlayer?.playPause());
        this._nextButton = this._addButton(box, 'media-skip-forward-symbolic',
            () => this._activePlayer?.next());
        this.add_child(box);

        this.menu.box.add_style_class_name('mg-media-menu');
        this._list = new St.BoxLayout({
            style_class: 'mg-media-list',
            orientation: Clutter.Orientation.VERTICAL,
            x_expand: true,
        });
        this.menu.box.add_child(this._list);

        this.connect('destroy', this._onButtonDestroy.bind(this));

        this._source.connectObject(
            'player-added', (_source, player) => this._addPlayer(player),
            'player-removed', (_source, player) => this._removePlayer(player), this);
        // Players that were announced before this button existed.
        for (const player of this._source.players) {
            if (player.canPlay)
                this._addPlayer(player);
        }
    }

    _addButton(box, iconName, callback) {
        const button = new St.Button({
            style_class: 'mg-panel-button',
            can_focus: true,
            reactive: true,
            y_align: Clutter.ActorAlign.CENTER,
            child: new St.Icon({
                icon_name: iconName,
                style_class: 'system-status-icon',
            }),
        });
        // These buttons live inside a PanelMenu.Button, whose default handler
        // toggles the popup on any press within its area. We fire the action
        // ourselves and STOP the event so it never reaches that toggle; only
        // the (un-intercepted) service icon still opens the popup.
        const activate = () => {
            if (button.reactive)
                callback();
            return Clutter.EVENT_STOP;
        };
        button.connect('button-press-event', activate);
        button.connect('touch-event', (_actor, event) =>
            event.type() === Clutter.EventType.TOUCH_BEGIN
                ? activate() : Clutter.EVENT_PROPAGATE);
        // Keyboard / accessibility activation still works via 'clicked'.
        button.connect('clicked', () => callback());
        box.add_child(button);
        return button;
    }

    get activePlayer() {
        return this._activePlayer;
    }

    setActivePlayer(player) {
        if (this._activePlayer === player)
            return;
        this._activePlayer = player;
        this.refresh();
    }

    _addPlayer(player) {
        if (this._cards.has(player))
            return;
        const card = new MediaCard(player);
        this._cards.set(player, card);
        this._list.add_child(card);
        this._lastStatus.set(player, player.status);
        player.connectObject('changed', () => this._onPlayerChanged(player), this);

        // Most recently active wins; a newly arrived player only takes over
        // when nothing is selected or it is already playing.
        if (!this._activePlayer || player.isPlaying())
            this.setActivePlayer(player);
        else
            this.refresh();
    }

    _removePlayer(player) {
        const card = this._cards.get(player);
        if (!card)
            return;
        player.disconnectObject(this);
        this._cards.delete(player);
        this._lastStatus.delete(player);
        this._list.remove_child(card);
        card.destroy();

        if (this._activePlayer === player) {
            this._activePlayer = null;
            const remaining = [...this._cards.keys()];
            this.setActivePlayer(remaining.find(p => p.isPlaying()) ?? remaining.at(-1) ?? null);
        }
        this.refresh();
    }

    _onPlayerChanged(player) {
        const status = player.status;
        const previous = this._lastStatus.get(player);
        this._lastStatus.set(player, status);
        if (status === 'Playing' && previous !== 'Playing')
            this._activePlayer = player;
        if (player === this._activePlayer)
            this.refresh();
    }

    refresh() {
        const hasPlayers = this._cards.size > 0;
        this.visible = hasPlayers;
        if (!hasPlayers) {
            this.menu.close();
            return;
        }

        const player = this._activePlayer;
        if (!player)
            return;

        const { key, gicon } = detectService(player);
        if (key !== this._serviceKey) {
            this._serviceKey = key;
            this._serviceIcon.gicon = gicon;
        }

        const isPlaying = player.isPlaying();
        this._playButton.child.icon_name = isPlaying
            ? 'media-playback-pause-symbolic' : 'media-playback-start-symbolic';
        this._setSensitive(this._prevButton, player.canGoPrevious);
        this._setSensitive(this._nextButton, player.canGoNext);
        this._setSensitive(this._playButton, isPlaying ? player.canPause : player.canPlay);
    }

    _setSensitive(button, sensitive) {
        if (!sensitive) {
            button.fake_release();
            button.hover = false;
        }
        button.reactive = !!sensitive;
        button.can_focus = !!sensitive;
        button.opacity = sensitive ? 255 : DISABLED_OPACITY;
    }

    _onButtonDestroy() {
        this._source?.disconnectObject(this);
        for (const player of this._cards.keys())
            player.disconnectObject(this);
        this._cards.clear();
        this._lastStatus.clear();
        this._activePlayer = null;
        this._source = null;
    }
}

GObject.registerClass(MediaGlanceButton);
