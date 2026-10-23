# Team (crew workbench) — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `team`) on 2026-10-23.

## What it is

A client-only roster page styled as a film work print. Entries live in the visitor's browser (`localStorage`, key
`team-v2`). There is no backend, account or shared directory.

## Who it is for

A portfolio visitor (or the owner) who wants a quick private list of people, their role and availability.

## What works today

1. Pin a person with a name and role (both required) and an availability mark: Core, Collaborator or Available.
2. The header counts names on the rail; the roster shows how many match the search.
3. Search across name, role and mark (case-insensitive); remove a person.
4. The roster survives a reload in the same browser. Saved entries of the wrong shape or with an unknown mark are
   dropped instead of breaking the page; if storage is blocked, the roster lasts for the visit only.
5. `/api/mcp` answers JSON-RPC `initialize` and `tools/list` with an empty tool list: the roster never reaches the
   server, so any `tools/call` is refused with an error.
6. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- No skill tags, project associations, contact actions or onboarding-time savings (the portfolio card was corrected
  to Prototype in the 2026-10 review).
- No editing an entry, no sync between devices, no export.

## Live URL and deploy state

- Live: https://team.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-team-frontend` is deployed only by CLI. Its last production deploy is the CVE
  patch (2026-10-23, CLI, commit 50c4766). Its Git link names the old repository `bookchaowalit/bookchaowalit-team-frontend`,
  so a push to `main` does not deploy: the L2 work (tests, Sentry, lib store, truthful MCP route) stays undeployed
  until the owner reconnects Vercel Git to this repository (owner action D9). `NEXT_PUBLIC_SENTRY_DSN` is already set
  on the Vercel project (Sentry project `community-team-web`, org `personal-yu0`).

## Boundaries

- Browser-only apart from the stateless `/api/mcp` route.
