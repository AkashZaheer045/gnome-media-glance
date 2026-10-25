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
        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'audio-x-generic-symbolic',
        });

        // --- Placeholder group: real options will land here later ---
        const options = new Adw.PreferencesGroup({
            title: 'Options',
            description: 'Settings for Media Glance will appear here. Nothing to '
                + 'configure yet — the control shows automatically whenever '
                + 'something is playing.',
        });
        const placeholder = new Adw.ActionRow({
            title: 'No options yet',
            subtitle: 'Coming soon',
            sensitive: false,
        });
        placeholder.add_prefix(new Gtk.Image({ icon_name: 'preferences-system-symbolic' }));
        options.add(placeholder);
        page.add(options);

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
