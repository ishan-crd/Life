# Life — the Loud dashboard

An iPad-first life dashboard built with Expo (SDK 57) and React Native, replicated end to
end from the `Life Dashboard Dark.dc.html` Claude Design file: five full-bleed pages you
swipe between, dark and light themes, and local-first data for everything you track.

<img src="docs/overview.png" alt="Overview page" width="820" />

## What's in it

| Page | What it does |
| --- | --- |
| **Overview** | Greeting, day/week/month range, today's plan, focus timer, deep-work bars, consistency chart, focus heatmap and today's agenda. |
| **Board** | Three-column kanban with long-press drag between columns, per-card editing, plus the "Every day" ritual checklist and its progress dial. |
| **Calendar** | Month grid with event dots, month navigation, a day detail pane with full event CRUD, and the week-split meters. |
| **Habits** | Weekly habit dot grid, meds & pills with a progress ring, sleep, water and step tiles. |
| **Notes** | Masonry note wall with inline editing, tags and sizes. |

Plus a sign-in screen (**Sign in with Apple** and email) and a six-step onboarding flow
that asks what you're chasing and seeds your rituals, focus block length and health goals.

## Running it

```bash
npm install
npm run ios      # iPad simulator (landscape)
npm run web      # browser preview
```

The app locks to landscape and is laid out for iPad; the shell is responsive, so it also
runs on a Mac Catalyst-sized window or in the browser.

## How it is put together

```
src/
  auth/        sign-in screen, Apple button, animated aurora backdrop, onboarding
  components/  pager, header, sheet, icons and the motion-matched UI primitives
  pages/       the five dashboard pages
  state/       zustand stores persisted to AsyncStorage (dashboard + profile)
  theme/       design tokens for both themes, plus the design's easing curves
```

**Motion.** Every transition in the design maps to a token in `src/theme/motion.ts`:
`cubic-bezier(.22, 1, .36, 1)` for settles, `cubic-bezier(.34, 1.56, .64, 1)` for the
springy presses. The pager reproduces the prototype's gesture exactly — 90px snap
threshold, 0.28 rubber-banding at the ends, and a velocity-aware fling.

**Theming.** The design drives colour through CSS custom properties with dark values as
inline fallbacks and a `LIGHT` override map. Both sets are transcribed in
`src/theme/tokens.ts` and switched by the header's sun/moon toggle.

**Data.** There is no backend. Two zustand stores persist to `AsyncStorage`: one for the
dashboard, one for the account and onboarding answers. Sign in with Apple uses
`expo-apple-authentication` when the device supports it; email accounts are local.

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run ios
npm run android
npm run web
```

## Screens

| Sign in | Board |
| --- | --- |
| <img src="docs/signin.png" width="420" /> | <img src="docs/board.png" width="420" /> |

| Calendar | Habits |
| --- | --- |
| <img src="docs/calendar.png" width="420" /> | <img src="docs/habits.png" width="420" /> |

| Notes | |
| --- | --- |
| <img src="docs/notes.png" width="420" /> | |
