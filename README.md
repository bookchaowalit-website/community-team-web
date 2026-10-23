# Team (crew workbench)

A small studio roster kept in this browser: pin a person with a name, a role and an availability mark (Core,
Collaborator, Available), search the roster, remove someone. The roster is saved in `localStorage` on this device
only.

Live: https://team.bookchaowalit.com (deployed by Vercel CLI; it can lag `main`, see `PRODUCT.md`).

## What it does not do

- No skill tags, project links, contact actions, accounts or invitations. Nobody else sees the roster.
- No backend or sync: clearing site data or using another browser starts again from the one sample entry.
- No editing an entry after it is pinned.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: roster logic and storage, MCP route, home page render, Sentry scrubbing
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (with a line-coverage gate) and the shared security
scan on every push and PR to `main`.

## Code map

- `lib/team.ts`: sample entry, parse/serialize of the saved roster (bad entries are dropped, a non-list falls back to
  the sample), search, add/remove, and the `localStorage` store the page reads with `useSyncExternalStore`.
- `app/page.tsx`: the crew workbench page.
- `app/api/mcp/route.ts`: stateless JSON-RPC endpoint; `initialize` and an empty `tools/list`, every call refused.
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when
  `NEXT_PUBLIC_SENTRY_DSN` is unset.
- `app/more-projects/page.tsx`: shared portfolio link page (copied per repository, not a package).
