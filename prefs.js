// SPDX-License-Identifier: GPL-3.0-or-later
// Media Glance - preferences window
//
// v1 ships a placeholder page (no tunables yet); this exists so Extension
// Manager shows the settings gear and we have a home for future options.

import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gio from 'gi://Gio';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MediaGlancePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'audio-x-generic-symbolic',
        });

        // --- Panel placement ---
        const placement = new Adw.PreferencesGroup({
            title: 'Panel placement',
            description: 'Where the control sits in the top bar. Default is the '
                + 'right box, outermost, so the clock stays centered.',
        });

        // Position: left / center / right
        const BOXES = ['left', 'center', 'right'];
        const positionRow = new Adw.ComboRow({
            title: 'Position',
            subtitle: 'Which area of the top bar',
            model: Gtk.StringList.new(['Left', 'Center', 'Right']),
        });
        const curBox = settings.get_string('panel-position');
        positionRow.selected = Math.max(0, BOXES.indexOf(curBox));
        positionRow.connect('notify::selected', row => {
            settings.set_string('panel-position', BOXES[row.selected]);
        });
        placement.add(positionRow);

        // Index within the chosen box
        const indexRow = new Adw.SpinRow({
            title: 'Order within the box',
            subtitle: '0 is the outermost edge; higher moves it toward the center',
            adjustment: new Gtk.Adjustment({
                lower: 0, upper: 20, step_increment: 1, page_increment: 1,
            }),
        });
        settings.bind('panel-index', indexRow, 'value',
            Gio.SettingsBindFlags.DEFAULT);
        placement.add(indexRow);

        page.add(placement);

        // --- About group ---
        const about = new Adw.PreferencesGroup({ title: 'About' });

        const version = this.metadata['version-name'] ?? String(this.metadata.version ?? '1');
        about.add(new Adw.ActionRow({ title: 'Version', subtitle: version }));

        const url = this.metadata.url ?? 'https://github.com/AkashZaheer045/gnome-media-glance';
        const repoRow = new Adw.ActionRow({
            title: 'Source code',
            subtitle: url,
            activatable: true,
        });
        repoRow.add_suffix(new Gtk.Image({ icon_name: 'adw-external-link-symbolic' }));
        repoRow.connect('activated', () => {
            Gio.AppInfo.launch_default_for_uri(url, null);
        });
        about.add(repoRow);
        page.add(about);

        window.add(page);
    }
}
