# Agency OS — Front-End Application

[![Angular](https://img.shields.io/badge/Angular-22.0.0-red.svg)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-4.0.8-yellow.svg)](https://vitest.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-lightgrey.svg)](<>)

The **Agency OS Front-End** is an enterprise-grade Single Page Application (SPA) built with **Angular 22** utilizing a pure standalone component architecture, Angular Signals for fine-grained reactivity, Tailwind CSS v4 for modern responsive styling, Keycloak OAuth2/PKCE authentication, STOMP/WebSocket real-time timer updates, and Vitest for testing.

---

## Tech Stack

- **Framework**: Angular `22.0.0` (Pure Standalone Component Architecture, zoneless-ready)
- **Language**: TypeScript `~6.0.2` (Strict Mode)
- **Styling**: Tailwind CSS `^4.1.12` with `@tailwindcss/postcss` and custom design tokens
- **State Management & Reactivity**: Angular Signals (`signal()`, `computed()`, `effect()`) + `httpResource` + RxJS `~7.8.0`
- **Routing**: `@angular/router` with lazy-loaded standalone components and functional guards (`authGuard`, `redirectIfAuthenticatedGuard`, `roleGuard`, `tenantGuard`)
- **Authentication**: Keycloak OpenID Connect / OAuth2 (Authorization Code Flow with PKCE)
- **Real-Time Client**: STOMP over SockJS (`@stomp/stompjs` + `sockjs-client`)
- **Testing**: Vitest `^4.0.8` with `jsdom: ^28.0.0`
- **Code Formatting & Linting**: Prettier `^3.8.1`, ESLint `^9.x`

---

## Feature Modules

| **Landing & Onboarding** | High-conversion landing page, feature highlights, and interactive "How It Works" walkthrough. |
| **Dashboard Overview** | Real-time aggregated metrics (active clients, active projects, open tasks, billable hours, invoice financials), budget burn meters, priority tasks, and interactive stopwatch widget. |
| **Workspace Management** | Multi-organization switcher, workspace creation, teammate directory, role assignments, and ownership transfer. |
| **Workspace Invitations** | Send email/username invites with role scoping, and view/accept/decline incoming invitations. |
| **Client CRM** | Client registry with lifecycle stages (`PROSPECT`, `ACTIVE`, `INACTIVE`), billing contacts, and project linking. |
| **Project Tracking** | Project planning with fixed budgets, hourly billing rates, health indicators, and role-based client scoping. |
| **Task Kanban Board** | Interactive drag-and-drop workflow statuses (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`), assignees, and deadlines. |
| **Live Stopwatch & Time Logging** | Real-time stopwatch ticker (start, pause, resume, stop) synced across users via WebSockets, with manual timesheet logging. |
| **Invoice Center & PDF Viewer** | One-click invoice generation aggregating unbilled project hours with in-app multi-page PDF previewer and status management. |
| **User Profile & Account Center** | Keycloak account profile management, password resets, active session termination, and identity provider linking. |

---

## Project Structure

```
src/
├── app/
│   ├── core/                        # Core infrastructure & singleton services
│   │   ├── api/                     # Typed REST API services & domain models
│   │   │   ├── models/              # TypeScript interfaces (Account, Client, Project, Task, Time, Invoice, Workspace)
│   │   │   └── services/            # Http services (Account, Client, Project, Task, TimeEntry, Invoice, Workspace, Invitation)
│   │   ├── auth/                    # Keycloak authentication, AuthStore, functional guards & interceptors
│   │   ├── multitenancy/            # WorkspaceStore, active tenant signal & tenantGuard
│   │   ├── services/                # ThemeService (Dark/Light mode), ToastService
│   │   └── tokens/                  # Environment injection tokens
│   ├── shared/                      # Reusable UI widgets, models, and pipes
│   │   ├── components/              # Buttons, Modals, Tables, Badges, Form controls, Loaders
│   │   └── pipes/                   # Currency, Date, Duration formatters
│   ├── features/                    # Standalone feature route components
│   │   ├── clients/                 # Client CRM list, modal dialogs, and deletion guards
│   │   ├── dashboard-overview/      # Metric summaries, recent activity, and quick actions
│   │   ├── how-it-works/            # Interactive product tour
│   │   ├── invoices/                # Invoice list, creation wizard, PDF modal viewer
│   │   ├── landing-page/            # Marketing landing page with hero and feature cards
│   │   ├── profile/                 # Profile modal tabs (Personal, Security, Sessions, Linked Accounts)
│   │   ├── projects/                # Project cards, budget tracking, create/edit modal
│   │   ├── tasks/                   # Kanban task board, create/edit modal, status patchers
│   │   ├── time-tracking/           # Live stopwatch bar, manual log modal, timesheet table
│   │   ├── unauthorized/            # 403 Forbidden landing view
│   │   └── workspaces/              # Workspace switcher, member manager, ownership transfer
│   ├── layout/                      # Application shell, responsive sidebar, topbar, timer status widget
│   ├── app.config.ts                # Application providers (Router, HttpClient, Keycloak)
│   ├── app.routes.ts                # Application routes with functional guards
│   └── app.ts                       # Root bootstrap component
├── styles.css                       # Global Tailwind CSS stylesheet (@import 'tailwindcss')
└── main.ts                          # Application bootstrap entry point
```

---

## Getting Started

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm 10+
- Running Keycloak server (Port 8080 or configured URL)
- Running Agency OS Back-End API (Port 8080)

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

Navigate to `http://localhost:4200/`. The application will automatically reload on source changes.

### Running Unit Tests & Code Coverage

```bash
# Run all tests once with Vitest
npm test -- --run

# Run unit tests with code coverage report (SonarQube compatible)
npx ng test --watch=false --coverage

# Run in watch mode
npm test
```

> **Quality Gate Standards**: Built for SonarQube "Sonar Way" compliance, maintaining $\ge 80\%$ line & statement test coverage on new components and business logic.

### Building for Production

```bash
npm run build
```

Compiled production assets are output with optimizations into the `dist/agency-os` directory.

### Code Formatting & Linting

```bash
# Format code
npx prettier --write .

# Lint code
npm run lint
```

---

## Back-End API Integration

- **API Base URL**: `http://localhost:8080/api/v1`
- **Multi-Tenant Header**: Outgoing requests to tenant-scoped endpoints automatically include `X-Tenant-ID: <active_tenant_id>`.
- **Authentication**: Keycloak Bearer JWT attached via `Authorization: Bearer <token>` in `authInterceptor`.
- **WebSocket STOMP Broker**: Connects to `http://localhost:8080/ws-timer` with STOMP over SockJS:
  - `/topic/{tenantId}/timers/start`: Live stopwatch started
  - `/topic/{tenantId}/timers/pause`: Live stopwatch paused
  - `/topic/{tenantId}/timers/resume`: Live stopwatch resumed
  - `/topic/{tenantId}/timers/stop`: Live stopwatch stopped & logged
  - `/topic/{tenantId}/time-entries`: Manual time entry saved

---

## Documentation Reference

- [📐 Front-End Architecture & State Guide](docs/ARCHITECTURE.md)
- [📡 Back-End API Integration & WebSocket Guide](docs/API_INTEGRATION.md)
- [🎨 Design System & UI Specification](DESIGN.md)
