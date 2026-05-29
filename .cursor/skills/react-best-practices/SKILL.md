---
name: react-best-practices
description: Modern React 19 + strict TypeScript standards for this repo (Vite, Vitest, SCSS, Firebase, react-router-dom 7). Use when writing, fixing, refactoring, or reviewing React components, hooks, context, or tests in worship-timer.
disable-model-invocation: true
---

# React Best Practices

Engineering standards for this repo. Stack: React 19, strict TypeScript, Vite, Vitest, SCSS, Firebase, react-router-dom 7, dnd-kit.

## Project Structure

Place code in the existing layout — do not introduce a `features/` tree or new top-level folders without agreement.

```
src/
├── components/   # Shared UI (modals, cards, stage display, setup UI)
├── pages/        # Route entry points (SetupPage, CrewPage, ViewerPage, …)
├── hooks/        # Stateful hooks (useAuth, useSetupAutoSave, useEventLiveSync, …)
├── context/      # Providers + context types (EventSessionProvider, PlanProvider, …)
├── lib/          # Pure helpers, Firebase/auth, runtime engine — unit-test here
├── domain/       # Domain types and import/schedule logic — unit-test here
├── i18n/         # en.ts, th.ts, translate helper
├── layout/       # App shells (EventWorkspaceLayout)
├── config/       # Static config (stage templates, display)
└── styles/       # SCSS partials (stage themes)
```

Routes live in `src/routes.tsx` with static imports (no `React.lazy` in this project yet).

## Code Style

- No semicolons. Single quotes. 2-space indent. Match surrounding files.
- `type`-only imports use `import type { X } from '...'` (`verbatimModuleSyntax` is on).
- File extensions allowed in imports (`allowImportingTsExtensions`). Keep relative paths.
- No unused locals or params (`noUnusedLocals`, `noUnusedParameters` enforced). Clean before commit.
- No comment narration. Comments explain non-obvious intent only.
- Event handlers: `handle<Event>` (e.g. `handleSubmit`, `handleClose`).

## Components

- Function components only. No classes (except existing error boundaries if any).
- Props typed via explicit `type Props = {...}`. No `React.FC`.
- One responsibility per component. Extract when JSX or logic grows.
- Derive state, don't duplicate. Compute from props/state in render over mirroring into `useState`.
- Pass only props the child needs — not the whole parent state object.
- Keys: stable IDs, never array index for dynamic lists.
- Stage/setup styling: SCSS under `src/styles/`; avoid one-off inline styles when a partial exists.

## Hooks

- Follow rules of hooks. `eslint-plugin-react-hooks` is active — fix all warnings.
- Complete dependency arrays. No suppressing exhaustive-deps without justification.
- One effect = one concern. Split unrelated side effects (e.g. Firebase subscribe vs window resize).
- Cleanup effects (listeners, timers, Firebase subscriptions) in the returned function. Use a `cancelled` flag for async work (see `useAuth`).
- Avoid `setState` in an effect to sync from props/other state — derive during render instead. `setState` in effect is OK for external sources only (subscriptions, async results, timers).
- Prefer `useReducer` when several fields update together (setup draft, save status).
- Memoize only with measured cause: inline object/array/fn props that trigger re-render, or expensive compute. Don't pre-wrap everything.
- Extract reusable logic into `src/hooks/`; keep pure logic in `src/lib/` or `src/domain/`.

## Context

- Use existing providers (`EventSessionProvider`, `PlanProvider`, `ActiveControlProvider`, …) — don't add parallel global state.
- Don't put high-frequency state (mouse position, animation ticks) in context — it re-renders all consumers.
- Expose narrow context values; consumers should subscribe only to what they need.

## TypeScript (strict)

- No `any`. Use `unknown` + narrowing when type unknown.
- No non-null `!` unless invariant is provable; prefer guards.
- Prefer discriminated unions over boolean flags for status (`'idle' | 'saving' | 'error'` pattern used in repo).
- Type at boundaries (props, API/Firebase payloads, context values). Let inference handle locals.

## State & Data

- Keep business logic in `src/lib/` / `src/domain/` as pure, testable functions — UI stays thin.
- Firebase/async reads go through existing context/session layer (`EventSessionProvider`, `useEventLiveSync`, …); don't fetch ad hoc in components.
- Handle loading / empty / error states explicitly in UI.

## Accessibility

- Prefer semantic elements (`button`, `nav`, `main`, `label`) over `div` + `onClick`.
- Interactive controls need a visible label or `aria-label` when icon-only.
- Modals: trap focus while open; restore focus on close (`ConfirmModal`, `LeaveControlModal` patterns).

## Testing (mandatory)

- **Vitest** is the test runner. Tests today live beside logic in `src/lib/*.test.ts` and `src/domain/*.test.ts`.
- Every feature, fix, or refactor ships with tests. Untested business logic in `lib`/`domain` = incomplete.
- Prefer unit tests on pure functions; mock Firebase and collaborators with `vi.fn()`.
- When adding UI behavior worth asserting, add `@testing-library/react` first — then test what the user sees (`getByRole`, `getByText`), not implementation details.
- Update affected tests when changing behavior. Run `npm test` before declaring done.

## i18n

- No hardcoded UI strings. Add keys to both `src/i18n/en.ts` and `src/i18n/th.ts` and use the existing translation helper.

## Verify Before Done

```
- [ ] npm run lint clean
- [ ] tsc has no errors (npm run build or tsc -b)
- [ ] npm test passing; new/updated tests in lib/domain (or components if RTL added)
- [ ] i18n keys added to en + th
- [ ] loading / empty / error handled for new async UI
- [ ] interactive elements accessible (semantic tag or aria-label)
```
