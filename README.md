# Life

A life dashboard built with Expo (SDK 57) and React Native, replicated end to end from the
`Life Dashboard Dark.dc.html` Claude Design file: five full-bleed pages you swipe between,
dark and light themes, and local-first data for everything you track.

<img src="docs/overview.png" alt="Overview page" width="820" />

## What's in it

| Page | What it does |
| --- | --- |
| **Overview** | Greeting, day/week/month range, today's plan, focus timer, today's protein against your goal, deep-work bars, consistency chart, focus heatmap and today's agenda. |
| **Board** | Three-column kanban with long-press drag between columns, per-card editing, plus the "Every day" ritual checklist and its progress dial. |
| **Calendar** | Month grid with event dots and the day's protein grams, month navigation, a day detail pane with full event CRUD and a per-day protein log, and the week-split meters. |
| **Habits** | Weekly habit dot grid, meds & pills with a progress ring, sleep, water and step tiles. |
| **Notes** | Masonry note wall with inline editing, tags and sizes. |

Plus a sign-in screen (**Sign in with Apple** and email) and a six-step onboarding flow
that asks what you're chasing and seeds your rituals, focus block length and health goals
(water, protein and steps).

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

**Theming.** Everything visual resolves through `src/theme`, which is the single source
of truth and is re-exported from one barrel (`import { accent, radius, space, useTheme }
from '@/theme'`):

| File | Holds |
| --- | --- |
| `tokens.ts` | The two palettes. The design drives colour through CSS custom properties with dark values as inline fallbacks and a `LIGHT` override map; both sets are transcribed here, plus a few tokens the design hardcoded (heatmap legend, muted bars) so they survive the theme flip. |
| `scale.ts` | Radii, spacing, type sizes, tracking and fixed component heights. The design is not on an 8pt grid — it uses a specific set of values (26px gutters, 22px card radius, 9px chips) — so they are named rather than repeated as literals. |
| `motion.ts` | The easing curves and durations lifted from the design's CSS transitions. |
| `ThemeProvider.tsx` | Resolves the active theme once and hands it down by context. |

`useTheme()` reads context, not the store. Hundreds of components need the palette, and
subscribing each one to zustand would mean every subscriber re-evaluating on unrelated
updates — the focus timer alone ticks once a second.

**Render cost.** A few places are deliberately tuned: the focus countdown subscribes in a
leaf component so the overview's charts and 34 animated bars never re-render for it; habit,
pill and note rows are memoised so toggling one does not re-render its siblings; and the
note editor is uncontrolled, so typing a long note costs no re-renders and no per-keystroke
write to AsyncStorage.

**Sheets.** Every create/edit affordance — tasks, cards, events, habits, pills, notes,
account — routes through one `SheetProvider` in `src/components/Sheet.tsx`. It is presented
with [`insyd-bottom-sheet`](https://www.npmjs.com/package/insyd-bottom-sheet)'s
`SmoothSheet`, which brings the drag handle, drag-to-dismiss, backdrop tap and keyboard
avoidance. `<SheetHost>` is mounted in `App.tsx` below `ThemeProvider` so portaled sheet
content still resolves the palette.

**Protein.** Every logged item — a label and its grams, tagged Meal, Shake or Snack — is
bucketed by `YYYY-MM-DD` in `protein`, exactly the way `events` is, so the tracker and the
calendar are the same data seen twice: the month grid prints each day's total, the day pane
logs against it, and the overview shows today's. The daily goal comes from onboarding and is
retunable by tapping any total. Days before today are backfilled once per month, the same as
the sample agenda; today and everything ahead of it start empty.

**Data.** There is no backend. Two zustand stores persist to `AsyncStorage`: one for the
dashboard, one for the account and onboarding answers. Sign in with Apple uses
`expo-apple-authentication` when the device supports it; email accounts are local.

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint (expo config + typescript-eslint)
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

| Notes | Light theme |
| --- | --- |
| <img src="docs/notes.png" width="420" /> | <img src="docs/light-board.png" width="420" /> |

## Building for a device

```bash
npx eas build --profile preview --platform ios     # internal / simulator build
npx eas build --profile production --platform ios  # store build
```

Sign in with Apple needs a real build (it is unavailable in Expo Go and on web); the
screen falls back to email with a clear message when it is not supported.
