# Anchorchet

A private, two-person web app. Player 1 tracks her crochet projects, yarn stash
and university bowling sessions. Player 2 — the Anchor — sends her crochet
bounties, restocks her yarn, and watches her scores land in real time.

Built mobile-first for iPhone, with layouts that expand for iPadOS and desktop.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
```

It boots straight into **demo mode** with sample data — no setup, no accounts.
Sign in as either player from the landing screen.

> **Try the two-sided experience:** open the app in two browser tabs, enter as
> Player 1 in one and Player 2 in the other. The session is per-tab and the data
> is shared, so saving a bowling score in one tab updates the other instantly.

To test on your phone, run `npm run dev` and open the **Network** URL it prints
on a device on the same wifi.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

---

## Switching demo mode off (going live)

Demo mode stores everything in one browser. To get real accounts and sync
between two phones, connect Firebase:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Authentication → Sign-in method →** enable **Email/Password**.
3. **Build → Firestore Database →** create a database.
4. **Project settings → General → Your apps →** add a **Web app** and copy the config.
5. `cp .env.example .env` and paste the values in.
6. Restart the dev server.

The app detects the config and switches to live Firestore automatically — the
banner in **Settings → Data** flips from *Demo* to *Live*.

### Locking it down (do this before sharing the URL)

Firebase Auth lets *anyone* create an account against your project by default.
`firestore.rules` is an allowlist that keeps the two of you in and everyone else
out.

1. Create both accounts in the app.
2. Copy each UID from **Firebase console → Authentication → Users**.
3. Paste them into the `members()` list in `firestore.rules`.
4. Publish the rules (paste into **Firestore → Rules**, or `firebase deploy --only firestore:rules`).

### Deploying

`npm run build` produces a static `dist/` that works on any static host —
Firebase Hosting, Vercel, Netlify, Cloudflare Pages. Serve it over HTTPS: the
home-screen install and notifications both require a secure origin.

The app uses client-side routing, so configure the host to rewrite all paths to
`/index.html` (Vercel and Netlify do this for SPAs; Firebase Hosting needs
`"rewrites": [{ "source": "**", "destination": "/index.html" }]`).

---

## Multi-platform behaviour

The three layouts are pure CSS breakpoints, so rotating an iPad re-lays-out
instantly and there is no flash on load.

| Width | Layout |
| --- | --- |
| `< 768px` — iPhone | Bottom tab bar, single column, full-bleed cards |
| `768–1179px` — iPad portrait, split view | Icon side rail, single column |
| `≥ 1180px` — iPad Pro landscape, desktop | Labelled sidebar, two-column grids |

Specific things done for iOS/iPadOS:

- `viewport-fit=cover` plus `env(safe-area-inset-*)` padding, so the app paints
  into the notch and clears the home indicator.
- `100dvh` instead of `100vh` — `vh` on iOS Safari excludes the collapsing
  address bar and pushes the tab bar off screen.
- All inputs are 16px, which is what stops Safari zooming the page on focus.
  Pinch-zoom is deliberately left enabled.
- `touch-action: manipulation` to remove the 300ms double-tap delay; 44pt
  minimum touch targets throughout.
- Body scroll lock uses `position: fixed`, because iOS scrolls the page behind
  an `overflow: hidden` body.
- `overscroll-behavior: none` kills the rubber-band bounce in an installed PWA.
- Installable to the home screen (manifest + apple-touch-icon). **Settings**
  shows the install steps for whichever platform you are on.

### Notifications

Player 2 gets a local notification when a new bowling session appears. This uses
the Notification API rather than Firebase Cloud Messaging — both phones already
hold a live Firestore listener, so the document has arrived before anything
needs to be shown, and FCM would add a service worker, VAPID keys and a server
to send from.

On iPhone and iPad this requires **iOS 16.4+ and the app added to the home
screen**. In a normal Safari tab the permission request is a no-op.

---

## Modules

**Crochet quests.** Player 2 files bounties with a reference photo and a reward;
Player 1 accepts → starts → completes them. Completing one prompts for a photo
and posts it to the Hall of Fame automatically.

**Ready to Craft.** Cross-references the live yarn stash against a catalogue of
~56 patterns — Valorant buddies, Palworld pals, plus everyday beanies, bags and
homeware — and reports what she can make *right now* with no shopping trip.

It is a real allocation, not a per-colour lookup: slots compete for the same
balls, so a pattern needing cream for both the body and the trim will not match
one lone ball of cream twice. Weights one step apart are allowed as a flagged
substitution. When a pattern fails it says why — wrong colour, not enough balls,
or wrong weight.

**Yarn stash.** Colour, weight, ball count, brand, status. Free-text colour
names ("Dusty Rose", "cobalt") are normalised into colour families so matching
works without a dropdown. Marking something empty pushes it to Player 2's
shopping list.

**Bowling.** Session-based, not frame-by-frame. A session is tagged Training or
Tournament; you punch in each game total as it finishes and series total and
average compute themselves. A session dated today gets a **live card** at the
top with a single number field — one tap, type, save — which is the whole point
at an actual tournament.

**Tournament calendar.** Dates, locations, call times, and a live countdown to
the next event that backs off from per-second to per-minute ticks when the
target is more than a day out.

**Hall of Fame.** A shared gallery. She posts finished pieces; he posts photos
of himself *using* them, which is the part that makes the hours land.

**The Anchor dashboard.** Her latest score first, because that is why he opens
the app. The **Hype Button** lights up on a genuinely good result — a 200+ game,
a session ten pins above her running average, or any tournament day — and fires
confetti across her screen the next time she opens the app.

**Supply Drop.** Everything she flagged low or empty, one tap to copy as a
shopping list, plus a ranked list of which single ball would unlock the most
near-complete patterns.

**Focus Mode.** A Spotify embed pinned to the Crochet and Bowling screens so she
can change music without leaving the app. Paste any playlist link; the app ships
with none, since guessed playlist IDs 404.

---

## Architecture notes

```
src/
  lib/backend/     adapter layer — demo (localStorage) or Firebase, one switch
  data/            colour families, pattern catalogue, the matching engine
  context/         auth + a single set of live collection subscriptions
  components/      UI kit and the responsive shell
  screens/         player1/ · player2/ · shared
```

**The backend is an adapter.** Screens import `backend` and never learn which
implementation is behind it. `demoAdapter` fakes Firestore's realtime listeners
with a `BroadcastChannel`; `firebaseAdapter` is the real thing. Filling in
`.env` is the only step to switch. Both normalise timestamps to JS `Date`, so no
screen branches on backend type.

**Photos are stored as data URLs on the document.** They are downscaled and
re-compressed in the browser to land around 150 KB, which keeps everything on
Firestore's free tier with no Storage bucket, no CORS config and no signed URLs.
The trade-off is a hard ceiling — Firestore documents cannot exceed 1 MB — so
`lib/image.js` steps quality down and refuses anything that would risk it.

**One subscription set.** Both players read the same documents; the app is two
views over one dataset, not two datasets. `DataContext` opens the listeners once
so mounting more screens does not open more.

**Offline.** Firestore persistent cache is on, so the app keeps working when the
wifi drops at the alley — writes queue locally and flush on reconnect.

### Two Tailwind gotchas this codebase has already hit

Both cause the sidebar to render on top of the content, and neither is obvious:

1. **A custom breakpoint is emitted ahead of every built-in one**, regardless of
   its min-width. `desk:pl-64` lost to `md:pl-[76px]` at desktop widths. The fix
   is to retune the built-in `xl` rather than add a new key.
2. **Breakpoints must be declared in `rem`.** Tailwind sorts them by comparing
   values and cannot order `1180px` against the stock `48rem`, so a `px` value
   silently lands the block in the wrong place. See the comment in `index.css`.

Separately: a finished CSS transform animation computes to an *identity matrix*,
not `none` — which is still enough to create a containing block. That is why
`FloatingButton` portals to `<body>` instead of relying on `position: fixed`
inside the animated page wrapper.

---

## Data model

Matches the planned Firestore schema, with two additions: `hall_of_fame` (the
gallery holds both her finished pieces and his in-use photos, so it needs more
than a single field on the quest) and `hype_events` (hype has to survive until
she next opens the app, so it is a document with a `seen` flag rather than a
live signal).

```
users/{uid}                 name, role: player1|player2, avatar_url, email
crochet_quests/{id}         title, pattern_id, requested_by, status, reward,
                            priority, note, reference_image_url,
                            completion_photo_url, date_requested, date_completed
yarn_stash/{id}             color, weight, quantity, status: in_stock|low|empty,
                            brand, note
bowling_sessions/{id}       type: training|tournament, date, location,
                            game_scores[], series_total, session_average, note
tournament_calendar/{id}    title, date, location, call_time, notes
hall_of_fame/{id}           title, quest_id, kind: finished|in_use, caption,
                            image_url, uploaded_by, created_at
hype_events/{id}            to, from, message, headline, session_id, seen,
                            created_at
```
