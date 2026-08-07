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

With `.env` present it runs against the live `anchorchet` Firebase project and
shows the real email/password login.

To poke around without touching real data, move `.env` aside and restart — the
app falls back to **demo mode**: sample content, no accounts, stored in the
browser. In demo mode you can open two tabs and enter as Player 1 in one and
Player 2 in the other; sessions are per-tab and data is shared, so a score saved
in one tab appears in the other instantly.

To test on your phone, run `npm run dev` and open the **Network** URL it prints
on a device on the same wifi.

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint with oxlint |

---

## Firebase — what is already wired up

The `anchorchet` Firebase project is connected. Config is in `.env` (tracked on
purpose — Vite inlines those values into the client bundle at build time, so
they are public either way; the real access boundary is the rules file).
Verified against the live project:

- API key and project resolve.
- Email/Password sign-in is enabled.
- The app boots in live mode: real login form, no demo cards.

`firestore.rules` already contains both UIDs, so only you two can read or write
anything:

```
ioVbP69SI6TRCdemMOiTVqp9jgG2   Player 1 — the crafter
3OH4lfeofPY5iZUQ81FyHp0Dbz82   Player 2 — the anchor
```

## Four steps left (they need a browser login, which cannot be scripted)

**1. Create the Firestore database — required, nothing works without it.**
The project does not have one yet; an unauthenticated probe returns *"Cloud
Firestore API has not been used in project anchorchet before or it is
disabled."* In the Firebase console: **Build → Firestore Database → Create
database →** *Production mode* → pick the region closest to you. Region is
permanent, so choose deliberately.

**2. Publish the security rules.** Easiest from a phone: console → **Firestore
Database → Rules**, paste the whole contents of `firestore.rules`, **Publish**.
No CLI needed. Do this before step 4 — a database left in test mode is readable
by anyone with the URL.

> CI cannot do this for you by default. Deploying rules makes the CLI first
> check that the Firestore API is enabled, which needs `serviceusage.services.get`
> — a permission the service account Firebase generates does not have, so it
> 403s before reaching the rules. The workflow therefore treats the rules step
> as advisory and only warns. To make it work: Google Cloud console → **IAM** →
> the `firebase-adminsdk` service account → grant **Service Usage Consumer**.
> Until then, `firestore.rules` is the source of truth in the repo but is only
> applied when you paste it into the console.

**3. Deploy hosting.** Two options:

*From a computer:*
```bash
npm install -g firebase-tools
firebase login
firebase deploy          # firebase.json and .firebaserc are already committed
```
`firebase init` is not needed — the config is in the repo, and running it would
offer to overwrite these files.

*From a phone,* via the committed `.github/workflows/deploy.yml`:
1. Firebase console → **Project settings → Service accounts → Generate new
   private key** — downloads a JSON file.
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository
   secret**, name it `FIREBASE_SERVICE_ACCOUNT`, paste the entire JSON.
3. **Actions → Deploy → Run workflow.** Merging to `main` also deploys.

That service-account JSON *is* a real secret — unlike the Firebase web config,
it grants admin access. It belongs only in GitHub secrets, never in the repo.

**4. Both of you sign in and pick opposite roles.** The accounts exist but have
no profile document yet, so each of you gets the role picker on first sign-in.
If either taps the wrong one, **Settings → Your side of the app** switches it —
no data is lost.

Then add it to your home screens: **Settings** in the app shows the install
steps for whichever device you are on. On iPhone this must be done from Safari,
and it is also what unlocks notifications.

## Deploying elsewhere

`npm run build` produces a static `dist/`. Any static host works — Vercel,
Netlify and Cloudflare Pages connect straight to the GitHub repo with an OAuth
login and no service account, which is the least painful route from a phone if
Firebase Hosting turns into a fight. Serve over HTTPS: home-screen install and
notifications both require a secure origin. Configure the host to rewrite all
paths to `/index.html` for client-side routing (`firebase.json` already does).

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

### Staying current on the home screen

An installed home-screen app was serving a stale `index.html` after a deploy
even once Safari had picked the new one up — there was no service worker at
all, so iOS's own HTTP cache was the only thing deciding, and it kept the shell.

`vite-plugin-pwa` now generates one:

- **NetworkFirst** on navigations (4s timeout) — the shell is revalidated on
  every launch, and the cache is only a fallback for having no signal at the
  alley.
- **StaleWhileRevalidate** on scripts, styles, fonts and images — those URLs
  are content-hashed, so serving from cache while refreshing behind it costs
  nothing and feels instant.
- `skipWaiting` + `clientsClaim`, so a new build takes over as soon as it is
  accepted instead of waiting for every tab to close.
- `firebase.json` serves `sw.js`, `registerSW.js` and `workbox-*.js` with
  `no-store`. A cached service worker keeps you exactly one version behind
  forever, which is the same bug wearing a different hat.
- Firestore and Google auth requests are on the navigate-fallback denylist —
  the SDK does its own offline persistence, and a cached auth response is a bug.

`registerType` is `prompt`, not `autoUpdate`: an "App updated — Reload" banner
appears instead of the page reloading itself, because yanking the page out from
under her mid-way through logging a series would lose the form. The banner
re-checks for a new build hourly and on `visibilitychange`, `online` and
`focus`; an installed app can sit open for days without re-requesting anything.

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

**Yarn stash.** Colour, weight, ball count, brand, status. A 36-swatch picker
covers every colour family; each swatch sets the colour *name* as well as the
shade, because the engine matches on names — a bare hex would look right and
silently never match anything. Free text still works and is normalised into a
family. An eyedropper fine-tunes the exact shade for display only. Marking
something empty pushes it to Player 2's shopping list.

**Pattern references.** Every pattern carries a tinted archetype silhouette
drawn from the yarn that actually matched, plus one-tap links to Google Images,
Pinterest, Ravelry and YouTube. Either player can pin a real photo to a pattern;
it syncs to both phones and replaces the placeholder everywhere. Real photos are
not bundled — the game characters are somebody else's artwork.

**Wishlist / Buy requests.** She adds yarn, kits or tools with a Shopee or
TikTok Shop link (a missing `https://` is added, or the href navigates inside
the app instead of out to the shop). The same documents render as a buying
queue on Player 2's Supply Drop. Marking a yarn item bought drops it straight
into her stash.

**Crafter's Manual.** A reference tab in her Crochet workspace, in three parts.

*Videos* — Player 2 pastes a YouTube or TikTok link from a "Drop a tutorial"
card on his dashboard and it appears at the top of her library, embedded and
playable in-app; the seeded topics below it are deliberately *searches* rather
than hardcoded video IDs, because a baked-in ID dies the day that channel does.

*Glossary* — CH, SC, SL ST, INC, DEC, INV DEC, MR, FO, BLO/FLO and stitch
anatomy, each with a hand-drawn labelled diagram (`StitchDiagram.jsx`). SVG
rather than photos: for "where exactly does the hook go", a clean diagram beats
a photograph of yarn, which is mostly fuzz. A `visual_glossary` document with
the same id overrides any built-in entry, so a real GIF or a correction can be
dropped in later without a code change.

*Cheat sheets* — yarn weight → hook size, where the swatch bar physically
thickens with the strand, plus the amigurumi exception (go one or two sizes
smaller so stuffing cannot show through); and metric ↔ US hook conversion with
the dot scaled to the actual millimetres.

**My Projects.** Custom projects outside the pattern catalogue: reference
images, progress photos, and a yarn ledger. Usage is logged in quarter-skein
steps and subtracted from the stash immediately, clamped at zero so a mistyped
number cannot drive a ball negative, with status kept in step so the craft
engine and Supply Drop stay truthful.

**Over/under benchmark.** Set a per-game target and every game is scored
against the cumulative pace: 200 across two games is a 400 target, so 386 pins
reads "under 14" and the next game needs 214 to level. Targets past 300 are
flagged as not catchable in one game.

**Bowling arsenal.** Each ball carries a nickname, model, weight, coverstock,
a role (strike / spare / backup) and a 16x16 pixel-art design she draws in-app —
paint, fill, erase, mirror symmetry, undo, and seven generated presets.

**Per-ball stats and the oil matcher.** Sessions are tagged with the balls
thrown and the lane condition, which drives per-ball averages, spare conversion
for the designated spare ball, and recommendations like "on Heavy Sport Oil your
best average is 212 with The Purple Gem". Scores are logged per session, so a
session's games credit every ball on it; the UI says so and flags how many
sessions used more than one ball rather than implying per-throw precision. A
recommendation is marked provisional until it has two sessions behind it.

**The Cozy Alley.** A turn-based two-player pixel bowling minigame. Swipe up
the lane to throw: where the finger lands is the line, how fast it flicks is the
power, and how far it drifts sideways is the hook. A live dotted guide traces
the same curve the physics will use, so the preview cannot lie. The lane is
drawn at 96x128 and upscaled with smoothing off, which is what makes the pixels
crisp rather than a blurry vector look. Her arsenal designs are
the ball skins. Ten frames each, taken in turns across the two phones, with an
optional wager. Pin physics were grid-searched against target outcomes rather
than guessed: a flush pocket hit strikes about 40% of the time, a half-power
roll 11%, a wide ball 1%. Scoring is real ten-pin, unit-checked against a 300
game, all-spares 150 and all-nines 90.

**Session lifecycle.** A session is explicitly `live` or `ended` rather than
"is it dated today". The date check alone had two failures: there was no way to
close a session early, and one running past midnight silently lost its live card
mid-tournament. Ending is one tap, backed by a 12-second Undo bar and a Reopen
button that stays available all day. Starting a session closes any other, so
there is only ever one quick-add box. Sessions saved before this field existed
fall back to the old date check so nothing in history reopens itself.

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
can change music without leaving the app. Ships with your playlist
(`37i9dQZF1EJCtsZ74SnoAi`) already loaded; paste any other share link to add
more. Note that ID has the `37i9dQZF1E…` prefix Spotify uses for *personalised*
mixes, which are usually tied to one account — if it shows as unavailable on her
phone, swap it for a normal or collaborative playlist.

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
                            game_scores[], series_total, session_average, note,
                            ball_ids[], oil_pattern, status: live|ended,
                            is_active, spares_converted, spare_attempts,
                            benchmark_target (always 200), current_over_under,
                            pins_needed_next_game
tournament_calendar/{id}    title, date, location, call_time, notes
hall_of_fame/{id}           title, quest_id, kind: finished|in_use, caption,
                            image_url, uploaded_by, created_at
pattern_refs/{patternId}    image_url, updated_at   (doc id IS the pattern id)
bowling_arsenal/{id}        name, nickname, role, weight_lbs, coverstock,
                            pixel_art_grid (256 hex strings), created_at
yarn_wishlist/{id}          title, url, kind, status: pending|purchased,
                            color, hex, weight, quantity, price, note,
                            added_date, purchased_date
custom_projects/{id}        title, note, status: in_progress|completed,
                            reference_images[], progress_photos[],
                            yarns_used[{stash_id,color,hex,quantity_used}],
                            created_at, completed_at
crochet_tutorials/{id}      title, media_url, media_type: video|gif,
                            category: anchor_dropped|basics|stitches|amigurumi,
                            added_by, date_added
visual_glossary/{termId}    abbreviation, full_name, description, visual_url,
                            tier   (doc id IS the term id — `sc`, `invdec`, … —
                            so an entry overrides the built-in of that name)
bowling_matches/{id}        wager, status, turn, winner, created_at,
                            rolls: {player1:[], player2:[]},
                            standing: {player1:[], player2:[]},
                            ball_ids: {player1, player2}
hype_events/{id}            to, from, message, headline, session_id, seen,
                            created_at
```
