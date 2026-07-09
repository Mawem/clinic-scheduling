# Architecture & Tradeoffs

This document explains the decisions behind the code, roughly in the order they were made.

## 1. Monorepo with a pure domain package

The repo is a pnpm/Turborepo workspace with one app (`apps/web`) and one library
(`packages/domain`). For an app this size a monorepo is arguably overkill — the deliberate
point is the **boundary**, not the tooling:

- `@clinic-scheduling/domain` contains the scheduling rules (interval overlap, double-booking,
  operating hours) as pure TypeScript with zero dependencies. It doesn't know React, HTTP, or
  MSW exist.
- Both the UI (form validation, drag pre-checks) and the mock API (request validation) import
  the *same* functions, so the client and "server" can never disagree about what a conflict is.
- The rules are exhaustively unit-testable without rendering anything.

In a real system this package is what you'd share between a React frontend and a Node/tRPC
backend — the same layering the eventual production stack would want.

**Tradeoff:** more scaffolding (workspace configs, `transpilePackages`). Accepted because the
boundary is the most valuable thing to demonstrate and to keep maintainable.

## 2. Mock REST API: MSW instead of Next.js route handlers

The requirement is "consume data from a mocked REST API (no database)". Two candidate designs:

1. **Next.js route handlers** with an in-memory store — a real HTTP server, but on serverless
   hosting (Vercel) each invocation may hit a different instance, so mutations randomly
   disappear between requests. Fine locally, embarrassing in a live demo.
2. **Mock Service Worker (MSW)** — the "server" runs in a Service Worker in the browser.
   The app's data layer still issues plain `fetch` calls to `/api/...` and handles real HTTP
   status codes; MSW intercepts at the network boundary.

I chose MSW. The app code is indistinguishable from code talking to a real backend (swap the
worker for a real API and nothing above `lib/api/` changes), state is consistent per browser
session, and the *same handlers* run in `msw/node` for integration tests.

**Tradeoffs:** state resets on page reload (acceptable for a demo; the store re-seeds
deterministically), and MSW ships in the production bundle (deliberate — the deployed demo *is*
the product here).

The mock API behaves like a defensive real backend: it re-validates every write and returns
`409` for double-bookings, `422` for hours/range violations, `404` for unknown ids, with a
structured `{ errors: [{ code, message }] }` body. Simulated latency (250–600 ms) makes
loading states and optimistic updates observable.

## 3. Server state vs UI state: TanStack Query + Zustand

- **TanStack Query** owns everything fetched over HTTP: caching per day
  (`["appointments", date]`), request lifecycle (`isPending`/`isError`), refetching, and
  optimistic mutations.
- **Zustand** owns purely client-side state: selected date, clinic filter, which dialog is open,
  toasts.

The split is intentional: server data has a lifecycle (stale, refetching, rolled back) that a
plain store handles badly, while ephemeral UI state doesn't need cache semantics. Zustand was
kept deliberately small — two stores, no middleware — matching its role as lightweight UI state
management rather than a data layer.

## 4. Optimistic updates with rollback

All mutations patch the query cache in `onMutate`, snapshot the previous value, roll back in
`onError` (with an error toast explaining *why* — e.g. the conflicting booking), and
re-sync with the server in `onSettled`. Drag-and-drop moves therefore feel instant, and a
rejected move visibly snaps the card back.

Validation runs **twice** on purpose: a client-side pre-check against the cached day gives
instant feedback (no request at all for an obviously invalid drop), and the API re-validates as
the source of truth. The pre-check only sees the day on screen, so cross-day edits rely on the
server check — a deliberate simplification.

## 5. The board itself

The grid is CSS: a column per sonographer, 48 × 15-minute slot cells, and absolutely
positioned appointment cards (`top`/`height` derived from minutes). No calendar library —
the layout math is ~10 lines and a library would obscure the drag-and-drop and validation
work the assessment asks about.

dnd-kit provides the drag layer: each empty slot is a droppable (and also a button that
creates an appointment at that time), each card a draggable. A 6px activation distance
distinguishes click (edit) from drag (move).

**Accessibility tradeoff:** dnd-kit's keyboard sensor conflicts with using Enter/Space to open
the edit dialog, and keyboard-dragging across a 192-cell grid is a poor experience anyway. So
drag is pointer-only, and the keyboard path to *the same outcome* is: focus card → Enter →
change time/sonographer in the dialog. The shadcn/ui dialog (a Base UI primitive), labeled
controls, `role="alert"` validation, and `aria-live` toasts cover the rest.

Form and overlay controls (buttons, dialog, selects, inputs) come from **shadcn/ui** on
Base UI primitives — accessible popups and focus management are solved problems that
shouldn't be hand-rolled. The board grid, appointment cards, and tabs stay custom: no
component kit expresses this layout, and the split shows both sides of the judgment call —
lean on the ecosystem where it's commodity, build only what's genuinely bespoke.

When a clinic filter is active, appointments at other clinics render dimmed **and inert**
(no drag, edit, or delete; `aria-disabled`): a card that looks disabled must be disabled.
They stay hit-testable so a click on a locked card does nothing, rather than falling
through to the empty slot behind it.

## 6. Responsive strategy: one sonographer per screen on mobile

A four-column time grid cannot shrink to 390px — squeezing it produced dual-axis scrolling
with the time gutter scrolled out of view. Instead of degrading the desktop layout, mobile
gets a different composition of the same pieces (the Google Calendar day-view pattern):

- Below `sm`, the board renders **one sonographer's column at a time**, full width, switched
  via a pill tab bar. A `matchMedia` hook drives this in JS rather than CSS-hiding the other
  columns, so the extra columns (and their 144 droppable slots each) aren't mounted at all.
- The board lives in a **single scroll container** with `position: sticky` pinning the time
  gutter (left) and sonographer headers (top) — orientation survives scrolling on every
  screen size.
- **Touch gets different drag semantics**: dnd-kit's `TouchSensor` with a 250ms long-press
  activates a drag, so ordinary swipes scroll the board and appointments can't be moved
  accidentally. Mouse keeps the 6px-distance activation. The delete button, hover-revealed
  on desktop, is always visible on coarse pointers (`pointer-coarse:` variant).
- The "new appointment" action moves from the header to a **floating action button** in
  thumb reach; dialog field rows stack to a single column.

**Tradeoffs:** slot heights stay 18px on mobile (tap-to-create a specific slot is a
secondary path — the FAB covers creation), and cross-sonographer drag isn't possible while
one column is shown — reassigning is done through the edit dialog, which is also the
keyboard path, so mobile and keyboard users share one well-tested flow.

## 7. Times as strings, math in minutes

Appointments store `date: "YYYY-MM-DD"` and `start`/`end` as `"HH:mm"` — no `Date` objects,
no timezones. Scheduling math converts to minutes-since-midnight at the domain boundary.
Clinic scheduling is wall-clock local by nature; introducing `Date`/UTC here would add DST
and serialization bugs without adding correctness.

## 8. Compliance posture (healthcare data)

Every patient in this app is fictional — the seed data is generated names against a mock
API, so there is no PHI and the board deliberately shows full appointment details for
reviewability. That choice is only correct *because* this is an assessment. A production
deployment handling real scheduling data would change the posture:

- **AuthN/AuthZ with role-based access** — schedulers, sonographers, and clinic staff see
  different scopes; today the app has no identity at all.
- **PHI minimization on shared surfaces** — a day board on a wall-mounted clinic screen
  should show initials or MRN fragments, not full patient names; full detail only behind
  an authenticated click with an audit trail.
- **Audit logging** of every read/write touching patient data (HIPAA requires access
  accounting), plus session timeouts on shared workstations.
- **Infrastructure** — BAA-covered hosting, encryption at rest, and no patient data in
  logs, analytics, or error reports (toast messages here include patient names — that's
  fine for fake data, but a real build would scrub identifiers from error channels).

None of this is implemented, intentionally: auth theater over fake data would add review
noise without demonstrating anything real. The list is here to mark where the line sits.

## 9. What I'd do next (not done, on purpose)

- **Real backend**: replace MSW with a Node/Bun API (the `lib/api` layer is the only seam) —
  Prisma + MySQL for storage, tRPC for end-to-end types, with `@clinic-scheduling/domain`
  validating on both sides. Concurrency (two schedulers booking the same slot) would need a
  transactional uniqueness check server-side.
- **E2E tests**: Playwright for the drag-and-drop path, which unit tests can't meaningfully cover.
- **Recurring schedules, multi-day/week views, sonographer availability windows** (lunch,
  PTO) — the domain `validateAppointment` context object is shaped so new rules slot in.
- **Undo** for deletes instead of `confirm()`, and conflict *suggestions* (nearest free slot).
