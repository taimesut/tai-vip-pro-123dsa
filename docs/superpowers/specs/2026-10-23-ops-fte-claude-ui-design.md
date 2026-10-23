# OPS-FTE Claude Design UI Refactor

Date: 2026-10-23
Repository: taimesut/OPS-FTE
Status: Design proposal for user review

## Purpose

Refactor every user-facing OPS-FTE interface to follow the Claude Design System while preserving the current product behavior, workflows, data, permissions, and API contracts. Keep the existing React, Tailwind, DaisyUI, and Google Apps Script implementation.

## Current interface surfaces

- React application shared by the PWA and the Violentmonkey userscript.
- Pages for home, internal and external missed-TO checks, TO lookup, QR creation, incident reports, and settings.
- Standalone QR image scanner page for choosing an image or taking a photo.
- Standalone launcher page.
- Google Apps Script application and its access/error states.

## Design system

Use the design-system token values below as the starting point and expose semantic CSS variables so components do not hard-code colors:

- Canvas: #FAF9F5
- Soft surface: #F5F0E8
- Card surface: #EFE9DE
- Strong cream surface: #E8E0D2
- Warm ink: #141413
- Body text: #3D3D3A
- Muted text: #6C6A64
- Hairline: #E6DFD8
- Primary coral: #CC785C
- Active coral: #A9583E
- Dark surfaces: #181715, #1F1E1B, #252320
- On-dark text: #FAF9F5
- Success, warning, and error retain distinct semantic colors.

Coral is reserved for primary actions and selected emphasis. Operational status colors remain clear and consistent. Use a serif display stack for page and section headings, with public fallbacks such as Cormorant Garamond, Georgia, and serif. Keep Be Vietnam Pro or the existing sans stack for Vietnamese body text, dense controls, and tables. Do not add proprietary font files.

Preserve the existing light/dark preference. The dark theme uses warm dark surfaces and cream-toned text. Use medium 8/12/16px corner radii by hierarchy, restrained borders, and minimal shadows. Avoid neon, rainbow gradients, and excess pill-shaped controls.

## Architecture and implementation boundaries

1. Keep the existing React app and route structure. PWA and userscript continue to render the same shared pages.
2. Define the React design tokens and reusable base styles in the current global styling layer, then apply them through existing page and component classes. Do not replace Tailwind, DaisyUI, or the React component model.
3. Keep userscript styling isolated in its Shadow DOM. Check the floating launcher, panel surface, focus handling, and SPX host-page coexistence.
4. Keep scanner and launcher as standalone pages, but map their CSS variables and interaction states to the same tokens and typography rules.
5. Trace how the Apps Script HTML is authored, bundled, and deployed before changing it. Update the real source and its generated/deployed output as required; do not treat a generated artifact as the sole source of truth.
6. Limit changes to presentation, layout, styling, and accessible labels where needed. Do not alter route behavior, API calls, business rules, data shape, or workflow ordering.

## Screen and component treatment

- App shell: warm canvas, clear SOC identity, quiet navigation, and a restrained active-page state. Keep the menu and close controls easy to reach.
- Home: group existing destinations by task and use a clear heading hierarchy. Avoid decorative marketing content that competes with operational actions.
- Missed-TO checks and TO lookup: keep filters and primary actions close to results. Retain table columns and density; use subtle separators, readable row spacing, and horizontal scrolling on narrow screens when needed.
- QR creation and scanning: keep choose-image, take-photo, result, loading, no-code, error, and close states visually distinct. Do not add real-time camera scanning.
- Incident reports: style existing steps, editors, summaries, and submission states consistently. Preserve all current report fields and save behavior.
- Settings: group related SOC, Hub, and other configuration fields. Distinguish saved, unsaved, loading, and failure states.
- Launcher and access/error states: maintain a concise hierarchy, readable explanation, and one clear primary action.

## Responsive and accessibility requirements

- Maintain mobile-first behavior and safe-area insets. Use a single-column layout below 768px, two-column patterns only when space allows, and desktop widths that suit operational density.
- Keep touch targets at least 44px where practical, visible keyboard focus, semantic headings, accessible labels, and live status announcements.
- Preserve reduced-motion support and sufficient contrast for both themes.
- Tables may scroll horizontally instead of truncating identifiers or removing operational columns.

## Verification plan

Run the repository checks after implementation:

- npm run lint
- npm test
- npm run build
- npm run build:userscript
- npm run build:launcher
- npm run build:scanner
- npm run bundle:gas

Review every route in light and dark themes at mobile and desktop widths. Specifically check the userscript inside its Shadow DOM, table overflow, settings states, incident workflow states, scanner error/loading states, launcher layout, and Apps Script access/error screens.

## Completion criteria

- All current user-facing screens follow the shared token, typography, spacing, surface, and interaction rules.
- Existing screen content, routes, business behavior, and table information remain intact.
- All listed builds and tests pass, or any pre-existing failure is recorded with evidence.
- No functionality changes are included in the UI refactor.

## Self-review

- Scope is limited to existing OPS-FTE interfaces.
- The app framework and existing business logic remain unchanged.
- The design tokens and light/dark behavior are specified.
- The Apps Script source/build relationship is explicitly a discovery step before editing.
- The verification plan covers all build targets and major responsive/state variations.
