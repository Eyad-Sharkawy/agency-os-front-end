# Agency OS — Front-End Application

[![Angular](https://img.shields.io/badge/Angular-22.0.0-red.svg)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.0.8-yellow.svg)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-lightgrey.svg)]()

The **Agency OS Front-End** is a single page application built with **Angular 22** using a pure standalone architecture, Angular Signals for reactive state management, Tailwind CSS v4 for styling, and Vitest for testing.

---

## 🛠 Tech Stack

- **Framework**: Angular `22.0.0` (Pure Standalone Component Architecture)
- **Language**: TypeScript `~6.0.2`
- **Styling**: Tailwind CSS `^4.1.12` with `@tailwindcss/postcss`
- **State Management & Reactivity**: Angular Signals (`signal()`, `computed()`, `effect()`) + RxJS `~7.8.0`
- **Routing**: `@angular/router` with lazy-loaded standalone components and functional guards
- **Authentication**: Keycloak OpenID Connect / OAuth2 (PKCE flow)
- **Real-Time Client**: STOMP over SockJS (`@stomp/stompjs` + `sockjs-client`)
- **Testing**: Vitest `^4.0.8` with `jsdom: ^28.0.0`
- **Code Formatting**: Prettier `^3.8.1`

---

## 📂 Project Structure

```
src/
├── app/
│   ├── core/                        # Singleton services, interceptors, auth, guards
│   │   ├── auth/                    # Keycloak OIDC service & auth guard
│   │   ├── interceptors/            # Auth, Tenant (X-Tenant-ID), and Error interceptors
│   │   ├── multitenancy/            # WorkspaceStore & active tenant signals
│   │   └── websocket/               # TimerWebSocketService (STOMP / SockJS)
│   ├── shared/                      # Reusable UI widgets, models, and pipes
│   │   ├── components/              # Buttons, Modals, Tables, Form controls
│   │   └── models/                  # TypeScript domain interfaces
│   ├── features/                    # Feature modules (Workspaces, Clients, Projects, Tasks, Time, Invoices)
│   ├── layout/                      # Application shell, sidebar, and topbar
│   ├── app.config.ts                # Application providers (router, http client)
│   ├── app.routes.ts                # Application routes
│   └── app.ts                       # Root bootstrap component
├── styles.css                       # Global Tailwind CSS stylesheet (@import 'tailwindcss')
└── main.ts                          # Bootstrap application entry point
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 10+

### Installation
```bash
npm install
```

### Development Server
```bash
npm start
# or
ng serve
```
Navigate to `http://localhost:4200/`. The application will automatically reload upon source code changes.

### Running Unit Tests
```bash
npm test
```
Executes unit tests using Vitest and jsdom.

### Building for Production
```bash
npm run build
```
Build artifacts are compiled with optimizations into the `dist/` directory.

### Code Formatting
```bash
npx prettier --write .
```

---

## 🔗 Back-End API Integration

- **API Base URL**: `http://localhost:8080/api/v1`
- **Multi-Tenant Header**: Outgoing requests must include the `X-Tenant-ID` header corresponding to the active workspace.
- **Authentication**: Keycloak Bearer JWT attached via `Authorization: Bearer <token>`.
- **Live Timers**: Connects to `/ws-timer` with STOMP over SockJS subscribing to `/topic/{tenantId}/timers/start` and `/topic/{tenantId}/timers/stop`.

---

## 📚 Documentation Reference

- [📐 Front-End Architecture & State Guide](docs/ARCHITECTURE.md)
- [📡 Back-End API Integration & WebSocket Guide](docs/API_INTEGRATION.md)
