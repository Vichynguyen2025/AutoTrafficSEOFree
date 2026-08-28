# AutoTrafficSEO

Windows Desktop application for managing multiple browser profiles, proxies, and automated website scenarios using **Chromium + Playwright**.

## Tech Stack

- **Electron** — Desktop shell
- **React + TypeScript** — Frontend UI
- **Vite** — Frontend bundler
- **Tailwind CSS** — Styling
- **Playwright + Chromium** — Browser automation
- **MySQL + Prisma ORM** — Database

## Directory Structure

```
autotraffic-seo/
├── electron/          # Electron main process
│   ├── main.ts        # Main entry
│   ├── preload.ts     # Context bridge
│   └── ipc/           # IPC handlers
│       ├── profile.ts # Profile CRUD
│       ├── browser.ts # Chromium browser control
│       └── proxy.ts   # Proxy management
├── src/               # React frontend
│   ├── components/    # Shared components
│   ├── pages/         # Page components
│   └── types/         # TypeScript types
├── prisma/            # Database schema
└── build/             # Build resources
```

## Development

```bash
npm run dev          # Start Vite dev server + Electron
npm run prisma:push  # Push schema to MySQL
npm run prisma:generate # Generate Prisma client
```

## Build

```bash
npm run build        # Build renderer + electron
npm run build:win    # Build Windows installer (.exe) in dist-release/
```

## Phase 1 Features

- ✅ Profile Manager (CRUD, clone, open/close Chromium)
- ✅ Proxy Manager (CRUD, test, import)
- ✅ Database schema (MySQL + Prisma)
- ✅ Dashboard UI
- ✅ Windows installer config (Electron Builder)

## Phase 2 (Coming)

- Scenario Builder (workflow steps)
- Campaign & Task execution
- Scheduler
- Auto Update
