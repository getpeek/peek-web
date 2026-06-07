# Peek Web

The marketing site for **Peek** — a Figma-like GUI database client where users
place nodes (AI assist, query, result, chart, chat…) on an infinite 2D canvas.
The product itself is a Tauri/React desktop app; **this repo is the public
landing page only**. There is no database, no auth, no host bridge here — it is
a static, content + animation site.

The current page is a single cosmic-themed landing page: full-viewport hero with
a planet/orb behind a giant italic "Peek" wordmark, an **interactive demo
canvas** that walks through the product flow (Ask → Run → Branch), four feature
sections, a telemetry stats row, a closing CTA, and a footer.

> ⚠️ **This is NOT the Next.js you know** (see `AGENTS.md`). This Next version
> has breaking changes vs. older releases. Read the relevant guide in
> `node_modules/next/dist/docs/` before writing framework code. Heed deprecation
> notices.

# Stack

- **Framework**: Next.js 16 (**App Router**) — `src/app/`.
- **UI**: React 19 with the **React Compiler enabled** (`next.config.ts:
  reactCompiler: true`). Do not add manual `useMemo`/`useCallback`/`memo` unless
  you've verified the compiler can't handle it.
- **Language**: TypeScript, `strict`. Path alias `@/*` → `src/*`.
- **Styling**: CSS Modules (`*.module.css`), one per component, with native CSS
  nesting. Global tokens + base styles live in `src/app/globals.css`.
- **Fonts**: `next/font/google` — JetBrains Mono (mono/body), Montserrat
  (section headings), Inter (display / italic wordmark — stands in for the
  paid "Söhne" used in the source design).
- **Package manager**: npm (`package-lock.json`). No yarn/pnpm.

# Project layout

```
src/
  app/
    layout.tsx        Root layout — fonts, <html>/<body>, metadata. (default export, Next requirement)
    page.tsx          Landing page — composes the section components. (default export, Next requirement)
    globals.css       --pk-* design tokens, base body styles, reset
  landing/            The landing-page feature; one folder per section
    Starfield/        Fixed cosmic background (universe + nebulae)
    Nav/
    Hero/
    DemoCanvas/       Interactive canvas demo (client component + hooks + node sub-components)
    Feature/          Reusable copy+demo row + the four "instrument" demos
    Stats/
    Closing/
    Footer/
```

# Code style

Adapted from the Peek product repo. Follow it here.

## General

- Avoid nested `if`s; keep cyclomatic complexity low. Return early.
- Prefer immutability — chain `const` declarations rather than mutating locals.
- Use full words for identifiers (`truncatedString`, not `truncString`).
- TypeScript: never widen to `any`; prefer `unknown` and narrow. Use
  `import type { … }` for type-only imports.
- **Named exports only — with one exception:** Next.js requires `default`
  exports for `app/page.tsx`, `app/layout.tsx`, and other special files
  (`loading`, `error`, `not-found`, route handlers). Use a default export there
  and **only** there. Everything else (section components, hooks, helpers) uses
  named exports.

## Proximity principle

Code that changes together lives together. Group by feature, not by file type —
never create catch-all `utils/`, `types/`, or `helpers/` folders that collect
files solely by kind.

- **Folders are features.** A folder describes one thing (a section, the canvas,
  a node) and contains everything it needs: its component, hooks, helpers, types,
  and `.module.css`.
- **Single-consumer helpers stay co-located.** A hook or sub-component used by
  exactly one parent belongs in the parent's folder. Don't lift it "just in case."
- **Promote only when crossing feature boundaries.** Move a helper up the tree
  only when a consumer outside the feature needs it.
- **When a file grows, split within the folder first.** Extract a child component
  or hook into a sibling file before reaching for a new top-level directory.

## Composability

Components stay thin. Push advanced logic into hooks. The demo canvas is the
model: `DemoCanvas.tsx` is the shell; pan/zoom lives in `useCanvasView`, the flow
state machine + streaming in `useDemoFlow`, edge geometry in `edges.ts`. Prefer
extracting a child component over piling responsibility into the parent.

## Functions

Small and self-contained. At most three parameters; if you'd reach for a fourth,
take a single options object instead.

## Comments

Comments explain **why**, never **what**. Only write one when the reason is
non-obvious — a hidden constraint, a workaround, a subtle ordering requirement.

## Styling

- **Theme tokens are CSS variables prefixed `--pk-*`**, defined in
  `src/app/globals.css`. **Never hardcode palette colors, font stacks, or the
  shared hairline/card surfaces** — reference a `--pk-*` token. Add a new token
  there if one is missing. (One-off derived `rgba()` glows/shadows that are an
  alpha variant used a single time may stay inline; the rule targets the reusable
  palette.)
- **One `.module.css` file per component**, imported from the component file.
- Use **nested rules** rather than flattening everything to the top level.
- Dynamic/state-driven classes are toggled in JSX
  (`className={clsx(styles.node, entered && styles.entered)}`), not by string
  class manipulation — CSS Module class names are hashed.

## Responsive (mobile-first)

Every section has to work on mobile — no part of the site is desktop-only. Treat
small screens as the default, not an afterthought.

- **Write mobile-first.** The base, breakpoint-free rules are the mobile layout.
  Layer the larger-screen styles on top inside a `min-width` media query —
  never start desktop and patch downward with `max-width` overrides.
- **One breakpoint is enough.** Go straight from mobile to everything else; the
  site uses `@media (min-width: 768px)` as that single breakpoint value. Don't
  add tablet / desktop tiers unless a section genuinely can't be served by the two.
- **Nest the media query inside the rule it overrides** — not in a separate block
  at the bottom of the file. Put the `@media (min-width: 768px)` override directly
  inside the selector whose declarations it changes, so the mobile base and its
  larger-screen variant sit together and it's obvious at a glance which rules are
  overridden at which size. A file therefore has many small nested `@media` blocks
  (one per overridden selector, all sharing the same breakpoint), never one big
  trailing block that forces you to cross-reference selectors by name.

  ```css
  .hero {
    padding: 2rem 1rem;

    @media (min-width: 768px) {
      padding: 6rem 3rem;
    }
  }
  ```
- Prefer fluid sizing (`clamp()`, `vw`/`vh`) over per-breakpoint values where it
  removes the need for an override.

# Commands

- `npm run dev` — Next dev server (Turbopack).
- `npm run build` — production build + type-check. Run before declaring a task
  done if you've touched TS/TSX.
- `npm run start` — serve the production build.

# Don'ts

- Don't add backwards-compat shims or `// removed: …` markers when refactoring.
  Delete the old code.
- Don't introduce a new styling system (Tailwind, CSS-in-JS) or state library —
  extend what's here. Plain React state + CSS Modules is the house style.
- Don't add `useMemo`/`useCallback`/`memo` reflexively; the React Compiler
  handles most of it. Only add them with a measured reason.
- Don't write speculative abstractions or options no caller passes. Three similar
  lines beat a premature helper.
- Don't reach for a default export outside the Next.js special files listed above.
