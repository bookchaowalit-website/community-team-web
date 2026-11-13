# Design system — Team

## Overview

The team directory is a film-cutting workbench. A dark work-print rail holds the roster while a warm paper clip-board handles the local-only add flow.

## Colors

- #171717 — matte workbench black.
- #F2EFE7 — clip-board paper and primary light surface.
- #FF7047 — tape-orange action accent.
- #95CA8D — core availability mark.
- #A5A097 — pencil-gray secondary text.

## Typography

Trebuchet MS keeps the directory labels practical. Georgia is the human voice for names and editorial headings, making the roster feel authored rather than like a generic admin table.

## Layout

The page moves from a large workbench title to a perforated divider, then splits into a wide select rail and a narrow entry board. Roster rows preserve a visible index, name, role, status, and delete affordance.

## Elevation & Depth

The clip-board is the only raised material: a paper field with a tape strip at the top. The roster stays flat against black and uses rules as the organizing depth cue.

## Shapes

The system is square, tactile, and tool-like. Thin rules, perforation blocks, and underline inputs replace rounded cards and pills.

## Components

- Studio header and local-state count
- Roster search
- Film rail with indexed crew strips
- Availability marks and delete actions
- Clip-board add form

## Do's and Don'ts

- Do keep local-only behavior explicit.
- Do use the orange only for actions, emphasis, and tape-like marks.
- Don't imply employee accounts, invitations, or remote persistence.
- Don't turn the roster into a grid of identical profile cards.


---

## Storybook

Storybook 10 (`@storybook/nextjs-vite`) shows this design system with the app's real CSS, tokens and fonts.

```bash
npm run storybook        # http://localhost:6006
npm run build-storybook  # static build in storybook-static/ (CI: .github/workflows/storybook.yml)
```

- **Foundations/Tokens** reads every CSS custom property the app defines at runtime, so it never drifts from the code.
- **Design/DESIGN.md** renders this file.
- **Components/**, **Sections/** and **Pages/** show the UI with mock data only (no network, analytics off).
- Toolbar: locale, theme (light / dark, when the app has a dark theme), viewports 320 / 375 / 768 / 1440. The a11y panel runs axe (WCAG 2.2 AA).
- Rule: a new shared component or page section ships with a story in `stories/`.
