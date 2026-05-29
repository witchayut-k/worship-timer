---
name: react-best-practices
description: Modern React 19 + strict TypeScript engineering standards for this repo (Vite, Vitest, React Testing Library, SCSS). Use when writing, fixing, refactoring, or reviewing React components, hooks, context, or tests in this codebase.
disable-model-invocation: true
---

# React Best Practices

Engineering standards for this repo. Stack: React 19, strict TypeScript, Vite, Vitest + React Testing Library, SCSS, Firebase, react-router-dom 7, dnd-kit.

## Code Style

- No semicolons. Single quotes. 2-space indent. Match surrounding files.
- `type`-only imports use `import type { X } from '...'` (`verbatimModuleSyntax` is on).
- File extensions allowed in imports (`allowImportingTsExtensions`). Keep relative paths.
- No unused locals or params (`noUnusedLocals`, `noUnusedParameters` enforced). Clean before commit.
- No comment narration. Comments explain non-obvious intent only.

## Components

- Function components only. No classes.
- Props typed via explicit `type Props = {...}`. No `React.FC`.
- One responsibility per component. Extract when JSX or logic grows.
- Derive state, don't duplicate. Compute from props/state in render over mirroring into `useState`.
- Keys: stable IDs, never array index for dynamic lists.
- Co-locate component + its SCSS partial pattern already used in `src/styles/`.

## Hooks

- Follow rules of hooks. `eslint-plugin-react-hooks` is active — fix all warnings.
- Complete dependency arrays. No suppressing exhaustive-deps without justification.
- Memoize only with measured cause: inline object/array/fn props that trigger re-render, or expensive compute. Don't pre-wrap everything.
- Extract reusable logic into custom hooks (`useX`) in `src/lib/` or `src/hooks/`.
- Cleanup effects (listeners, timers, Firebase subscriptions) in the returned function.
- Avoid `setState` directly in an effect to sync from props/other state — derive/compute during render instead. `setState` in effect is fine only for external sources (subscriptions, async results, timers).

## TypeScript (strict)

- No `any`. Use `unknown` + narrowing when type unknown.
- No non-null `!` unless invariant is provable; prefer guards.
- Prefer discriminated unions over boolean flags for status (`'idle' | 'saving' | 'error'` pattern used in repo).
- Type at boundaries (props, API/Firebase payloads, context values). Let inference handle locals.

## State & Data

- Keep business logic in `src/lib/` / `src/domain/` as pure, testable functions — UI stays thin.
- Firebase/async reads go through existing context/session layer; don't fetch ad hoc in components.
- Handle loading / empty / error states explicitly.

## Testing (mandatory)

- Vitest + React Testing Library. Every feature, fix, or refactor ships with tests. Untested business logic = incomplete.
- Test behavior via user-facing queries (`getByRole`, `getByText`), not implementation details.
- Pure logic in `lib`/`domain` gets unit tests (see `src/lib/*.test.ts`). Mock collaborators with `vi.fn()`.
- Update affected tests when changing behavior. Run `npm test` before declaring done.

## i18n

- No hardcoded UI strings. Add keys to both `src/i18n/en.ts` and `src/i18n/th.ts` and use the existing translation helper.

## Verify Before Done

```
- [ ] npm run lint clean
- [ ] tsc has no errors (npm run build or tsc -b)
- [ ] npm test passing, new/updated tests included
- [ ] i18n keys added to en + th
```
