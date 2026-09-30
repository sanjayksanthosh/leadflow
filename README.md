# LeadFlow

Shared lead tracking for a 3-partner business. React + TypeScript + Vite, data in
`localStorage`, no backend.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production bundle into dist/
npm run smoke    # real Chrome, 35 checks (needs npm run build first)
```

## Using it

Pick a partner on the first screen — that partner is recorded on everything they log.
**Switch Partner** is in the profile menu (top right). The app starts with **no leads**;
**Profile → Delete all leads** wipes everything and starts over.

Four screens:

- **Home** — status cards that filter the list, then every lead with its status, who it
  is assigned to, the next action and the follow-up date. Overdue and due-today first.
- **Leads** — the same list plus search and status/partner/follow-up filters.
- **Lead** — who contacted it last, what they said, the full contact history, and the
  status dropdown.
- **Add / edit lead** — four fields: name, number, where they came from, status.

The status column is a dropdown, so a status changes straight from the list without
opening the lead. Logging a contact is the main action: it records who, when, how, the
response, the next action and the follow-up date, and derives the status from the
response.

## Layout

```
src/
  types.ts        entity shapes (Partner, Lead, Interaction)
  lib/            storage, dates, labels, selectors
  state/          store (context + reducer) — the only writer of app data
  components/     shared UI, the lead list, and the two modals
  pages/          Home, Leads, LeadDetails, Login
  styles/         tokens, base, components, pages
```

Everything goes through the store's reducer, and reads go through `lib/selectors.ts`.

## Rules the app enforces

- Logging a contact flips `New → Contacted` and derives status from the response type.
- Opening a lead shows who contacted it last, so two partners don't call the same person
  twice.
- A lead with a response but no next action is flagged so it can't be forgotten.
- Manual status changes win over derived status until the next contact is logged.

## Mobile

The layout is built for phones first: single column, bottom nav, drawer, full-width
tap targets, and the leads table turns into stacked cards with field labels under 720px.
