# CLAUDE.md - GamingOS Project Guide

## Overview
GamingOS is a web-based operating system UI combining macOS layout conventions with Windows 11 gaming aesthetics. Built with React 18, TypeScript, Tailwind CSS, and Vite.

This web UI lives in `web/` of the gaming-os repository; the repository root holds the bootc Linux image, which this app does not affect. Run every command below from `web/`.

## Commands
- `npm run dev`: Start Vite development server (port 8080)
- `npm run build`: Type-check (`tsc --noEmit`) and production build
- `npm run lint`: Run ESLint checks
- `npm run preview`: Serve the production build

## Tech Stack
- **Framework**: React 18 + Vite
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom glassmorphism utilities (`.glass`, `.glass-strong`) in `src/index.css`
- **Icons**: `lucide-react`
- **State**: React context + `useReducer`; no external state library

## Project Structure
```text
src/
├── components/
│   ├── Desktop.tsx        # Window manager & desktop orchestrator (owns window state)
│   ├── Dock.tsx           # Floating macOS-style application dock
│   ├── Window.tsx         # Draggable/resizable window shell, traffic lights, snapping
│   ├── TopBar.tsx         # Status bar: system menu, CPU/GPU/RAM, volume, battery, clock
│   ├── DesktopIcons.tsx   # Desktop shortcut grid (single/double-click launch)
│   ├── Wallpaper.tsx      # Animated ambient-glow wallpaper
│   ├── Notifications.tsx  # Toasts (downloads, achievements, now playing)
│   ├── FpsOverlay.tsx     # In-game FPS overlay
│   ├── AppIcon.tsx        # Gradient app tile used by dock and desktop
│   └── apps/
│       ├── registry.ts         # AppId -> metadata + component
│       ├── SteamClient.tsx     # Steam gaming client simulation
│       ├── FirefoxBrowser.tsx  # In-browser web navigation simulation
│       ├── TerminalApp.tsx     # Simulated gaming terminal with neofetch
│       ├── FileExplorer.tsx    # File system and game directory browser
│       ├── SettingsApp.tsx     # System theme & performance settings
│       └── AboutApp.tsx        # System specs & hardware info
├── context/
│   ├── SettingsContext.tsx      # Persisted user settings; writes accent CSS variables
│   ├── SystemContext.tsx        # Game library, installs, running game, live stats, toasts
│   └── WindowManagerContext.ts  # openApp/closeApp/... exposed to apps (provided by Desktop)
├── data/                  # Mock data: apps metadata, games, file system, themes
├── hooks/                 # windowReducer, useViewport, useClock, useBattery, useClickOutside
├── types/                 # Shared TypeScript types (WindowState, Game, Settings)
├── pages/
│   └── Index.tsx          # Root desktop mount (providers + Desktop)
└── index.css              # Global tokens & glassmorphism classes
```

## Conventions
- **Adding an app**: add its id to `AppId` (`types/os.ts`), metadata to `data/apps.ts` (`APP_META`, `APP_ORDER`), and the component to `components/apps/registry.ts`. The dock, desktop icons and `launch <app>` pick it up automatically.
- **Accent color**: use the `accent` / `accent-2` Tailwind colors (`bg-accent/20`, `text-accent`). They read the `--accent` RGB variables, so never hardcode the purple.
- **Window geometry**: `position`/`size` on `WindowState` are the free-floating bounds and are kept while maximized or snapped; `effectiveBounds()` in `Window.tsx` computes what is on screen.
- **Tailwind classes** must appear literally in source (no string-built class names), or the build drops them.
- All game titles, studios and hardware stats are fictional/simulated.
