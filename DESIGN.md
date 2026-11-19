# Design

Since 2026-11-19 the team roster uses the shared **App shell** (see `APP-SHELL.md`; `app/app-shell.css` and `components/app-shell.tsx` are copied byte for byte
from the reference site). It replaced the earlier one-off look, whose small uppercase labels, unloaded or
render-blocking fonts and low-contrast text failed the design floor (review 2026-11-11).

- Sidebar of availability (Everyone / Core / Collaborator / Available with counts; a pill row on phones),
  head with h1, count, search and **Add person** next to the list, so adding is in the first phone viewport.
  The composer opens in place (name, role, availability).
- Rows: name, role, an availability pill (text + tint) and a labelled Remove button (44px). Removing is
  undoable for a few seconds; no confirm dialog.
- Empty states differ for an empty roster, an empty availability list and a search with no match
  (Clear search puts focus back in the field).
- Every control keeps the shell's 3px focus ring; no `outline: 0`.

Floor: Geist via `next/font` (variable on `<html>`), text ≥ 12px, controls ≥ 44px, 4.5:1 text contrast in
light and dark, 3px focus ring, forced-colors support, no horizontal scroll at 320px. `/more-projects`
redirects (308) to https://bookchaowalit.com/ and the footer links there.
