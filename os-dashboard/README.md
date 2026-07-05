# Hermes OS Dashboard

Phone-first control center for Hermes Agent. Built with React 19, TypeScript, Tailwind CSS v4.

## Screens

| Screen | Description |
|--------|-------------|
| **Connect** | Connection setup with host/port/API key |
| **Sessions** | Session list with new chat creation |
| **Chat** | SSE streaming chat with markdown rendering |
| **Cron Jobs** | Full CRUD for scheduled tasks |
| **Memory** | Browse Hermes persistent memory |
| **Skills** | View installed skills |
| **Settings** | Model selection + connection info |

## Design

- Material 3 Expressive (LastChat-inspired)
- AMOLED dark (#0a0a0a) with gold accent (#D4AF37)
- Glassmorphism surfaces, 20px/28px rounded shapes
- Inline SVG icons, custom markdown renderer

## Quick Start

```bash
cd os-dashboard
npm install
npm run dev
```

Opens at `http://localhost:5173` — connect to your Hermes instance (default `http://127.0.0.1:8642`).

## Production Build

```bash
npm run build
# Output: hermes_cli/os_dashboard_dist/
```

The web server auto-serves the dashboard at `/os-dashboard/` when the dist exists.

## APK Build

Requires Android SDK (API 26+, Gradle 8.5+):

```bash
cd android
bash build-apk.sh
```

Or open the `android/` folder in Android Studio and build from there.

## API Endpoints

### Gateway (port 8642, Bearer auth)
- `GET /health` — connection check
- `GET /api/sessions` — list sessions
- `GET /api/sessions/{id}/messages` — session messages
- `POST /v1/chat/completions` — streaming chat (SSE)

### Dashboard (port 9119, 3 auth modes)
- **Proxied** — no auth (behind reverse proxy)
- **Password** — cookie-based session auth
- **Insecure** — token scrape from HTML

## Architecture

```
src/
  api/hermes.ts      — API layer (Gateway + Dashboard)
  store/useStore.ts  — Zustand state (localStorage persist)
  theme/             — Design tokens + CSS-in-JS styles
  components/        — Sidebar, Icons
  pages/             — 7 screen components
```
