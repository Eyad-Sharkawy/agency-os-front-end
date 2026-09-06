---
version: 1.0.0
name: Agency-OS-Design-System
description: The Agency OS Design System is a high-precision enterprise UI architecture built with Tailwind CSS v4, modern utility tokens, crisp typography, and an emerald-accented minimalist color palette.

colors:
  brand-green: "#059669"
  brand-green-light: "#10b981"
  brand-green-dark: "#047857"
  brand-green-pale: "#edfce9"
  primary: "#17171c"
  dark-surface: "#071829"
  deep-slate: "#1f2937"
  canvas: "#ffffff"
  canvas-dark: "#0f172a"
  soft-stone: "#f9fafb"
  surface-stone: "#f3f4f6"
  hairline: "#e5e7eb"
  hairline-dark: "#334155"
  ink: "#111827"
  ink-muted: "#6b7280"
  ink-light: "#9ca3af"
  error: "#ef4444"
  error-pale: "#fef2f2"
  warning: "#f59e0b"
  warning-pale: "#fffbeb"
  success: "#10b981"
  success-pale: "#ecfdf5"
  info: "#3b82f6"
  info-pale: "#eff6ff"

typography:
  fontFamily:
    sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
    mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"]
  scale:
    hero-display:
      fontSize: "48px"
      fontWeight: "700"
      lineHeight: "1.1"
      letterSpacing: "-0.02em"
    section-heading:
      fontSize: "30px"
      fontWeight: "600"
      lineHeight: "1.2"
      letterSpacing: "-0.01em"
    card-heading:
      fontSize: "20px"
      fontWeight: "600"
      lineHeight: "1.3"
    body-large:
      fontSize: "18px"
      fontWeight: "400"
      lineHeight: "1.5"
    body:
      fontSize: "15px"
      fontWeight: "400"
      lineHeight: "1.5"
    button:
      fontSize: "14px"
      fontWeight: "500"
      lineHeight: "1.4"
    caption:
      fontSize: "13px"
      fontWeight: "400"
      lineHeight: "1.4"
    mono-badge:
      fontSize: "12px"
      fontWeight: "500"
      lineHeight: "1.3"

rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"

components:
  button-primary:
    backgroundColor: "{colors.brand-green}"
    hoverBackgroundColor: "{colors.brand-green-dark}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.scale.button}"
  button-secondary:
    backgroundColor: "{colors.soft-stone}"
    hoverBackgroundColor: "{colors.surface-stone}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.error}"
    hoverBackgroundColor: "#dc2626"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  badge-status:
    padding: "3px 8px"
    rounded: "{rounded.pill}"
    typography: "{typography.scale.mono-badge}"
  modal-dialog:
    backgroundColor: "{colors.canvas}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.xl}"
    shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
  stopwatch-banner:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    accentColor: "{colors.brand-green}"
    rounded: "{rounded.lg}"
---

# Agency OS — Design System & UI Specification

The **Agency OS Design System** is an enterprise-grade UI foundation built on **Tailwind CSS v4**. It emphasizes functional minimalism, high contrast readability, dark mode support, and clear data visualization.

---

## 1. Color System

### Primary & Brand Identity

- **Agency OS Emerald Green** (`#059669`, `#10b981`, `#047857`): Primary brand accent representing productivity, timer execution, and financial health.
- **Deep Slate Canvas** (`#17171c`, `#071829`): Used for dark mode containers, navigation shells, and the active stopwatch ticker.
- **Surface Neutrals** (`#ffffff`, `#f9fafb`, `#f3f4f6`, `#e5e7eb`): High-legibility backgrounds and card boundaries for light mode.

### Semantic Status Palette

| Status / Role                   | Background                             | Text Color                               | Used In                                          |
| ------------------------------- | -------------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| **ACTIVE / DONE / PAID**        | `bg-emerald-50 dark:bg-emerald-950/30` | `text-emerald-700 dark:text-emerald-400` | Completed tasks, active clients, paid invoices   |
| **IN_PROGRESS / SENT**          | `bg-blue-50 dark:bg-blue-950/30`       | `text-blue-700 dark:text-blue-400`       | In-progress projects/tasks, sent invoices        |
| **PLANNING / TODO / DRAFT**     | `bg-amber-50 dark:bg-amber-950/30`     | `text-amber-700 dark:text-amber-400`     | Planning projects, draft invoices, pending tasks |
| **URGENT / OVERDUE / INACTIVE** | `bg-rose-50 dark:bg-rose-950/30`       | `text-rose-700 dark:text-rose-400`       | Urgent priorities, overdue invoices              |

---

## 2. Typography Hierarchy

The interface utilizes **Inter** for clean UI legibility and **JetBrains Mono** for numerical and timing displays.

```
Hero Display        →  text-4xl font-bold tracking-tight (Marketing & Onboarding)
Section Heading     →  text-2xl font-semibold (Feature Titles)
Card Heading        →  text-lg font-semibold (Modal Headers, Card Titles)
Body Text           →  text-sm font-normal text-gray-700 dark:text-gray-300
Caption / Metadata  →  text-xs font-normal text-gray-500
Stopwatch Numbers   →  font-mono text-2xl font-bold tracking-wider
```

---

## 3. UI Component Patterns

### 3.1 Button Hierarchy

1. **Primary Action**: Solid emerald (`bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-medium`).
2. **Secondary Action**: Bordered neutral (`border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800`).
3. **Danger Action**: Solid red (`bg-rose-600 hover:bg-rose-700 text-white`).
4. **Ghost / Icon Button**: Transparent hover (`hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300`).

### 3.2 Modal Dialogs

- Overlay: `fixed inset-0 bg-black/50 backdrop-blur-sm z-50`
- Container: Centered, max-w-lg to max-w-2xl with `rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6`
- Focus trap and Escape key dismiss.

### 3.3 Live Stopwatch Widget

- Active state: `border-brand-green/30 bg-brand-green/5` with emerald pulsing indicator, `text-ink` numbers, and pause/complete controls.
- Paused state: `border-amber-500/30 bg-amber-500/5` with amber status badge, `text-ink` numbers, and resume/discard controls.
- Theme adaptive: Uses CSS variable design tokens (`--ink`, `--surface`, `--brand-green`) ensuring high-contrast legibility across both light and dark themes without hardcoded dark background overrides.
- Synchronized dynamically via WebSockets across topbar and dashboard overview.

### 3.4 Task Kanban Columns

- 4 workflow lanes: `TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`.
- Drag-and-drop card handles with real-time status patch updates.
- Visual badge indicators for assignee avatars, deadline proximity, and budget hours.

### 3.5 PDF Viewer Modal

- Embedded iframe / blob renderer for generated PDF invoices.
- Quick action controls: Print, Download, and Close.

---

## 4. Layout & Responsive Breakpoints

| Breakpoint                    | Width                  | Layout Behavior                                                          |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| **Mobile (`< 640px`)**        | Full width             | Collapsible mobile hamburger drawer, single column cards, stacked Kanban |
| **Tablet (`640px - 1024px`)** | Responsive             | Compact navigation sidebar, 2-column card grids                          |
| **Desktop (`≥ 1024px`)**      | Max container `1440px` | Full fixed sidebar, multi-column Kanban board, data tables               |

---

## 5. Dark Mode Implementation

- Controlled via `ThemeService` and persisted in `localStorage('theme')`.
- Styled using Tailwind CSS `dark:` variant classes across all components, form inputs, modals, and tables.
