# DineQR Frontend — Agent Guide

## Commands

```sh
npm install          # install deps
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build (typecheck then bundle)
npm run lint         # ESLint 9 flat config
npm run preview      # vite preview
```

No test framework is configured. Do not look for `jest`/`playwright`.

## Architecture

- **Multi-tenant SPA**: restaurant slug in path (`/:slug/menu`, `/:slug/admin/…`). Admin routes also work without a slug at `/admin/*`.
- **Two auth systems**: admin JWT (`localStorage auth_token`) and customer JWT (`localStorage customer_token`). Axios interceptor handles both — customer token is set manually via `Authorization` header on order creation, admin token is auto-injected.
- **Session**: session id / table info lives in `sessionStorage`, cart lives in `localStorage`.
- **State**: React Context only — no Redux/Zustand.
- **Theme**: dark/light persisted as `localStorage theme-mode`; toggled via `ThemeContext` which controls Ant Design's `ConfigProvider` algorithm and a `.dark` class on `<html>`.

## Code conventions

- **TypeScript strict mode**. `verbatimModuleSyntax: true` — use `import type` for type-only imports. `noUnusedLocals`, `noUnusedParameters` are errors.
- **CSS Modules** for admin pages (`*.module.css`). Customer pages use global CSS variables from `index.css` / Tailwind.
- **Ant Design v6** requires wrapping root in `<App>` (already done in `main.tsx`).

## API quirks

- Backend sends `Decimal` fields as strings — `api.ts` transform functions `parseFloat` every price/total. Always use the exported `api` object rather than calling axios directly.
- QR codes arrive as base64 strings and are converted to data-URIs in the caller.
- WebSocket URL is derived from `VITE_API_URL` (`http` → `ws`). Admin WS uses `?token=` query param; table WS uses path param. Exponential backoff with jitter, max 10 retries.

## Environment

- `VITE_API_URL` (default `http://localhost:8000`). A local `.env` exists with the dev value.
- `.env` is gitignored — do not commit it.

## Print / bill

- Bill print uses `data-print-section="bill"` and `data-print-hide` attributes. CSS in `index.css` handles print layout.

## Notable files

| Path | Role |
|---|---|
| `src/main.tsx` | Entrypoint — wraps `<ThemeProvider>` → `<App>` |
| `src/App.tsx` | Router — all route definitions |
| `src/services/api.ts` | API client with transform layer |
| `src/services/apiClient.ts` | Axios instance + interceptors |
| `src/services/tokenService.ts` | Token read/write helpers |
| `src/stores/AuthContext.tsx` | Admin auth state |
| `src/stores/CartContext.tsx` | Cart state (localStorage-backed) |
| `src/stores/SessionContext.tsx` | Table session state (sessionStorage-backed) |
| `src/hooks/useWebSocket.ts` | WebSocket hook (admin + table) |
| `src/theme/ThemeContext.tsx` | Dark/light theme toggle + Ant Design config |
| `src/types/index.ts` | All TypeScript interfaces/types |
| `src/index.css` | Global CSS variables, dark mode, print, safe-area, spinner |

## Branching Rules (MANDATORY)

Read `BRANCHING.md` at the repo root and follow it. Summary:

1. `main` = production. NEVER commit directly.
2. `dev` = shared integration base. ALL new work branches off `dev`. ALL completed features merge back into `dev`.
3. Feature branches: `feature/<short-description>`, one per task.
4. NEVER work directly on `dev` or `main` — always on a feature branch.
5. Before starting ANY task: `git checkout dev` → `git pull origin dev` → create feature branch.
6. When a feature is complete & tested: merge feature → `dev`, push `dev`.
7. Definition of Done must pass before merging into `dev` (see BRANCHING.md).
8. NEVER force-push to `dev` or `main`.
