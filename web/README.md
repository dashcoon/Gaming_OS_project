# GamingOS web desktop

A browser-based desktop for PC gamers: a macOS-style layout (top status bar, floating centered dock, traffic-light window buttons on the left) with Windows 11-style glass surfaces and snap layouts.

```bash
npm install
npm run dev      # http://localhost:8080
```

## What's inside

- **Desktop**: animated glowing wallpaper (4 presets), desktop icons (single- or double-click to open), floating dock with magnification, tooltips, launch bounce and open/minimized indicators.
- **Status bar**: live (simulated) CPU, GPU and RAM meters with a detail panel, Wi-Fi/online state, volume slider, battery (real Battery API when available) and clock.
- **Windows**: drag, resize from any edge or corner, click to bring to front, minimize to the dock, maximize/restore (green button or double-click the title bar), drag to the top edge to maximize or to the left/right edge to snap to half the screen.
- **Apps**
  - **Steam**: library grid and list, search and installed filter, install with download progress, play/stop, playtime, achievements (unlocked while you play), achievements overview.
  - **Firefox**: tabs, address bar (bare words search Wikipedia), back/forward/reload/home, bookmarks bar, history sidebar, iframe pages, and a fallback card for sites that refuse to be embedded.
  - **Terminal**: `help`, `neofetch`, `clear`, `launch <app>`, `ps`, `kill`, `steam list|play|install|stop`, plus `echo`, `date`, `uname`, `uptime`, `history`, `exit`. Tab completion and ↑/↓ history.
  - **File Explorer**: folder tree, quick access (Steam, Downloads, Documents, Videos), breadcrumbs, back/forward/up, search, list/grid views, properties pane with text previews. Double-click a game's `.exe` to launch it.
  - **Settings**: wallpaper, accent color (Cyberpunk Purple, Neon Cyan, Emerald), icon click mode, performance mode (changes FPS and load), FPS overlay, volume levels, spatial audio. Saved in the browser.
  - **About This PC**: OS version, CPU/GPU/RAM specs, live load and uptime, display and storage tabs.

See [CLAUDE.md](CLAUDE.md) for the code layout and conventions.
