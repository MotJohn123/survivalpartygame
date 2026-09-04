## 1. Project summary (for Copilot)

Build a full-stack, mobile-first web application in **Czech**, for a **weekend party game for friends**, visually inspired by the TV show *Survivor* — **only the graphic design/vibe** (tribal, jungle, fire, tropical, adventure look), **not the game rules**. Working title: **Survival Party**.

The app has two areas:
- **Player area** — public landing page, name-only login/registration, a main game page (profile, team, tasks, quests, voting, betting), a live leaderboard, points history, and a dashboard/newsfeed.
- **Admin area** at `/admin`, protected by a shared password, for managing tasks, points, teams, the dashboard, voting, and betting rounds.

The player-facing main game page must work as a **PWA** (installable, app-like, works after a flaky connection, sends push notifications) and the whole app deploys to **Vercel**.

All **UI text must be in Czech**. Code (variables, functions, DB fields, routes) stays in English, as is standard practice. Use the glossary in Section 9 for consistent Czech wording.

⚠️ **Design note:** Don't copy actual *Survivor* logos, fonts, or trademarked assets — just draw on the general tribal/jungle/torch/tropical aesthetic (see Section 3).

---

## 2. Recommended tech stack

| Layer | Recommendation | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router, TypeScript)** | One codebase for pages + API routes, great Copilot support, easy PWA setup |
| Styling | **Tailwind CSS** | Fast to build a custom tribal theme without fighting a component library |
| ORM | **Prisma** | Type-safe schema, easy migrations, Copilot generates Prisma code very reliably |
| Database | **Postgres via Neon**, added from the **Vercel Marketplace** | Serverless-friendly, first-party Vercel integration, works cleanly with Prisma — see note below |
| Auth/session | Custom — **signed, httpOnly cookie** (`jose`) holding a player/admin id. No passwords, no email. | Matches the "log in by typing your name" requirement; `jose` also runs on Vercel's Edge Runtime, which matters if your auth check lives in `middleware.ts` |
| Animations | **Framer Motion** | Needed for the dashboard "reveal" animation and voting/betting UI |
| Data fetching/polling | **SWR** or **TanStack Query**, polling every 5–8s for live-ish updates (active voting, betting, new dashboard posts, leaderboard) | Simpler and more robust than WebSockets for a small weekend event; upgrade to Socket.IO later only if needed (note: plain WebSocket servers don't run on Vercel Functions — you'd need Pusher/Ably or Supabase Realtime for that) |
| PWA | **`next-pwa`** (or a hand-rolled `manifest.json` + service worker if `next-pwa` fights the App Router) | Vercel serves the generated manifest/service worker as static files with no extra config needed |
| File uploads (photos) | **Vercel Blob** (`@vercel/blob`) | Vercel's filesystem is read-only at runtime, so photos can't be written to disk — Blob is the first-party, few-lines-of-code fix |
| QR codes | **`qrcode`** (renders client-side, no server round-trip) | Generates a scannable QR per task, encoding a link straight to that task's code |
| Push notifications | **`web-push`** (server) + native browser **Push API** with VAPID keys | Notifies installed PWAs when admin starts a task/voting/betting round or posts to the dashboard |

### Database — set up for Vercel

**Checked current status:** "Vercel Postgres" as its own product doesn't exist anymore — Vercel retired it in late 2024 and now offers Postgres through the **Vercel Marketplace**, with **Neon** as the main first-party option (Supabase and a couple of others are also listed there).

- **Recommendation: add Neon from your Vercel project's Storage tab** → **Connect Database** → **Neon**. Choose the *Vercel-Managed* option if you want one combined bill, or *Neon-Managed* if you'd rather bill through Neon directly (slightly more generous branching features). This automatically creates the database and injects the right environment variables into your project — no manual connection strings.
- The integration sets two connection strings you actually need:
  - `DATABASE_URL` — **pooled**, used by the running app (each serverless function invocation can otherwise open its own DB connection and exhaust Postgres's connection limit — the pooler avoids that).
  - `DATABASE_URL_UNPOOLED` — **direct**, used only by Prisma CLI commands (`migrate`, `db push`).
  - Reflected in the schema below via Prisma's `url` / `directUrl` fields.
- **Local dev:** `vercel env pull .env.local` after connecting the integration pulls both variables down, so you develop against the same real Postgres instance from day one — no "worked in SQLite, broke in prod" surprises.
- **One quirk to know about:** Neon computes scale to zero when idle, so the very first request after a quiet period can take a second or two to "wake up." Harmless for a weekend game, but add `&connect_timeout=15` to the pooled URL if you see occasional timeouts on the first request of the day.
- If you'd rather avoid an external DB dependency entirely, **Turso/libSQL** (SQLite-compatible) is a decent alternative — but since you're set on Vercel, Neon is the more natively supported path, so it's the default here.

---

## 3. Visual identity ("Survivor" inspiration, not the format)

- **Palette:** deep jungle green, burnt orange / fire red, sandy beige, driftwood brown, off-white "linen" background. Team colors act like *buffs* (bandana colors) — give each team a distinct accent color used on their name tag, badge, and avatar ring.
- **Typography:** a bold, slightly rugged condensed display font for headings (e.g. an open-source font like *Anton*, *Bebas Neue*, or *Oswald*) + a clean readable sans body font.
- **Iconography:** torch/flame (points), compass, palm leaf, rope knot, tribal geometric patterns as dividers/borders, a wooden-sign look for cards/buttons.
- **Motion:** torch flicker on point gains, a "tribal council"-style reveal for dashboard posts and voting/betting results (see Section 6.6), subtle grain/texture backgrounds rather than flat corporate UI.
- Keep it mobile-first — most players will use this on a phone during the event.

---

## 4. Data model (Prisma schema)

This directly extends the fields you specified, adding the supporting tables needed to make tasks, teams, voting, points history, and betting actually work (join tables, history, etc.). Give this to Copilot as-is to generate `schema.prisma`, or ask Copilot to scaffold the migration from it.

```prisma
// schema.prisma
datasource db {
  provider  = "postgresql"                  // Neon, via the Vercel Marketplace integration
  url       = env("DATABASE_URL")            // pooled connection — used at runtime
  directUrl = env("DATABASE_URL_UNPOOLED")   // direct connection — used for migrations
}

generator client {
  provider = "prisma-client-js"
}

enum TaskRepeatability {
  ONCE       // splnitelný jednou
  MULTIPLE   // splnitelný N-krát (viz maxCompletions)
  UNLIMITED  // splnitelný nekonečně
}

enum VoteType {
  YES_NO
  MULTIPLE_CHOICE
  PLAYER_SELECT   // player votes FOR another player from a candidate list
}

enum VoteScope {
  ALL           // celá hra
  TEAM          // jeden tým
  CUSTOM_GROUP  // ručně vybraná skupina hráčů
}

enum PointsSource {
  TASK
  PUBLIC_QUEST_GIFT_RECEIVED
  SETUP_QUESTION
  BETTING_WIN
  ADMIN_ADJUSTMENT
}

model Player {
  id           Int      @id @default(autoincrement())
  name         String   @unique
  photoUrl     String?
  points       Int      @default(0)
  teamId       Int?
  team         Team?    @relation(fields: [teamId], references: [id])
  sessionToken String?  @unique
  createdAt    DateTime @default(now())

  taskCompletions    TaskCompletion[]
  dashboardPosts     DashboardPost[]
  votesCast          VoteResponse[]
  voteCandidateOf    VoteCandidate[]
  voteEligibleFor    VoteEligibleVoter[]
  pointsSent         PointsTransfer[]    @relation("Sender")
  pointsReceived     PointsTransfer[]    @relation("Receiver")
  questionAnswers    QuestionAnswer[]
  pointsLedger       PointsLedgerEntry[]
  pushSubscriptions  PushSubscription[]
  bettingCandidacies BettingCandidate[]
  betsPlaced         Bet[]               @relation("Bettor")
  betsAsCandidate    Bet[]               @relation("BetOnCandidate")
  bettingWins        BettingWinner[]
}

model Team {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  color     String?  // hex code, used as the team's "buff" color
  players   Player[]
  createdAt DateTime @default(now())

  bettingRoundsAsTeamA BettingRound[] @relation("BettingTeamA")
  bettingRoundsAsTeamB BettingRound[] @relation("BettingTeamB")
}

model Task {
  id             Int               @id @default(autoincrement())
  taskCode       String            @unique
  taskText       String
  taskPoints     Int
  repeatability  TaskRepeatability @default(ONCE)
  maxCompletions Int?              // only used when repeatability = MULTIPLE
  isPublicQuest  Boolean           @default(false) // e.g. "make a drink" style quests
  isActive       Boolean           @default(true)  // admin can deactivate/cancel
  createdAt      DateTime          @default(now())

  completions TaskCompletion[]
}

model TaskCompletion {
  id            Int      @id @default(autoincrement())
  taskId        Int
  task          Task     @relation(fields: [taskId], references: [id])
  playerId      Int
  player        Player   @relation(fields: [playerId], references: [id])
  pointsAwarded Int
  photoUrl      String?  // optional, not required to complete — admin can feature it on the dashboard
  completedAt   DateTime @default(now())
}

// Used for the "public quest" flow: completing it lets you gift points to someone else
model PointsTransfer {
  id        Int      @id @default(autoincrement())
  fromId    Int
  from      Player   @relation("Sender", fields: [fromId], references: [id])
  toId      Int
  to        Player   @relation("Receiver", fields: [toId], references: [id])
  points    Int
  reason    String?
  createdAt DateTime @default(now())
}

// Append-only log of every point change — this is what powers "points history"
model PointsLedgerEntry {
  id        Int          @id @default(autoincrement())
  playerId  Int
  player    Player       @relation(fields: [playerId], references: [id])
  delta     Int          // can be negative (admin can deduct points too)
  source    PointsSource
  note      String?      // e.g. task text, betting round title, admin reason
  createdAt DateTime     @default(now())
}

model DashboardPost {
  id        Int      @id @default(autoincrement())
  playerId  Int?
  player    Player?  @relation(fields: [playerId], references: [id])
  text      String
  photoUrl  String?
  isSystem  Boolean  @default(false) // true = posted by admin, not a player
  createdAt DateTime @default(now())
}

model SetupQuestion {
  id        Int      @id @default(autoincrement())
  text      String
  points    Int      @default(0)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())

  answers QuestionAnswer[]
}

model QuestionAnswer {
  id         Int           @id @default(autoincrement())
  questionId Int
  question   SetupQuestion @relation(fields: [questionId], references: [id])
  playerId   Int
  player     Player        @relation(fields: [playerId], references: [id])
  answerText String
  answeredAt DateTime      @default(now())

  @@unique([questionId, playerId])
}

model Voting {
  id        Int       @id @default(autoincrement())
  question  String
  voteType  VoteType
  scope     VoteScope
  teamId    Int?      // used when scope = TEAM
  isActive  Boolean   @default(true) // == "vote_is_up"
  createdAt DateTime  @default(now())
  closedAt  DateTime?

  options        VoteOption[]
  candidates     VoteCandidate[]
  eligibleVoters VoteEligibleVoter[]
  responses      VoteResponse[]
}

model VoteOption { // used for MULTIPLE_CHOICE
  id       Int    @id @default(autoincrement())
  votingId Int
  voting   Voting @relation(fields: [votingId], references: [id])
  text     String
}

model VoteCandidate { // used for PLAYER_SELECT — who can be voted FOR
  votingId Int
  voting   Voting @relation(fields: [votingId], references: [id])
  playerId Int
  player   Player @relation(fields: [playerId], references: [id])

  @@id([votingId, playerId])
}

model VoteEligibleVoter { // who is ALLOWED to vote (derived from scope, but stored explicitly)
  votingId Int
  voting   Voting @relation(fields: [votingId], references: [id])
  playerId Int
  player   Player @relation(fields: [playerId], references: [id])

  @@id([votingId, playerId])
}

model VoteResponse {
  id        Int      @id @default(autoincrement())
  votingId  Int
  voting    Voting   @relation(fields: [votingId], references: [id])
  playerId  Int
  player    Player   @relation(fields: [playerId], references: [id])
  answer    String   // "yes"/"no", a VoteOption id, or a candidate Player id — as string
  createdAt DateTime @default(now())

  @@unique([votingId, playerId]) // one vote per player per voting
}

model PushSubscription {
  id        Int      @id @default(autoincrement())
  playerId  Int
  player    Player   @relation(fields: [playerId], references: [id])
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
}

// Betting: before a team-vs-team challenge, admin puts up 3 players from each side;
// other players bet on which one will turn out to be the best. No stake — a correct
// bet earns the round's flat rewardPoints, a wrong bet earns nothing (see Section 11).
model BettingRound {
  id           Int       @id @default(autoincrement())
  title        String?   // e.g. "Sázky: Ohnivci vs. Delfíni"
  teamAId      Int
  teamA        Team      @relation("BettingTeamA", fields: [teamAId], references: [id])
  teamBId      Int
  teamB        Team      @relation("BettingTeamB", fields: [teamBId], references: [id])
  rewardPoints Int       // points awarded per correct bet
  isOpen       Boolean   @default(true)   // admin manually closes before the challenge starts
  isResolved   Boolean   @default(false)  // true once admin has entered the actual best player(s)
  createdAt    DateTime  @default(now())
  closedAt     DateTime?
  resolvedAt   DateTime?

  candidates BettingCandidate[]
  bets       Bet[]
  winners    BettingWinner[]
}

model BettingCandidate { // the 3(+3) players admin puts up for betting
  bettingRoundId Int
  bettingRound   BettingRound @relation(fields: [bettingRoundId], references: [id])
  playerId       Int
  player         Player       @relation(fields: [playerId], references: [id])

  @@id([bettingRoundId, playerId])
}

model Bet {
  id             Int          @id @default(autoincrement())
  bettingRoundId Int
  bettingRound   BettingRound @relation(fields: [bettingRoundId], references: [id])
  bettorId       Int
  bettor         Player       @relation("Bettor", fields: [bettorId], references: [id])
  candidateId    Int
  candidate      Player       @relation("BetOnCandidate", fields: [candidateId], references: [id])
  createdAt      DateTime     @default(now())

  @@unique([bettingRoundId, bettorId]) // one active bet per player per round (can be updated while open)
}

model BettingWinner { // admin marks the actual best player(s) after the challenge
  bettingRoundId Int
  bettingRound   BettingRound @relation(fields: [bettingRoundId], references: [id])
  playerId       Int
  player         Player       @relation(fields: [playerId], references: [id])

  @@id([bettingRoundId, playerId])
}
```

---

## 5. Auth & sessions

- **Players:** `/` shows a single field, "Tvoje jméno" (your name) + a submit button.
  - If a `Player` with that name exists → treat as login, issue a session cookie for that player.
  - If not → create a new `Player` row (registration), then log in.
  - Names must be **unique** (case-insensitive compare) — if a duplicate is entered, show a friendly Czech message asking the player to add a number/nickname, rather than silently reusing someone else's identity.
  - Store the session as a **signed httpOnly cookie** (JWT via `jose`) containing the player id, long expiry (e.g. 30 days) so returning to the page after the cookie is set skips the name screen entirely and goes straight to `/game`.
- **Admin:** `/admin` shows a password field. Compare against a password stored in an environment variable (`ADMIN_PASSWORD`, default `survivalparty` for local dev — **change it for the real event, set it in Vercel's Project → Settings → Environment Variables**). On success, set a separate signed `admin_session` cookie. Protect all `/admin/*` pages and `/api/admin/*` routes with `middleware.ts` that checks this cookie — `jose`-signed JWTs verify fine on Vercel's Edge Runtime, which is what `middleware.ts` runs on by default.
- This is intentionally lightweight (no email/password/2FA) since it's a private game among friends — good enough for the purpose, not meant to be bank-grade security.

---

## 6. Player-facing features

### 6.1 Landing page (`/`)
- Name field + "Vstoupit do hry" button (login/register in one step, as above).
- If already logged in (valid cookie), redirect straight to `/game`.
- Visible buttons to `/dashboard` and `/leaderboard` — both viewable without forcing login, so people can peek before joining.

### 6.2 Main game page (`/game`, protected)
Shows, top of page:
- Player's **name**, **photo** (with upload/change option), and **points**.
- **Team section** — only rendered if the player has a `teamId`: team name, team color, and a list of teammates (name + photo + points). If no team yet, show a short "zatím nejsi v žádném týmu" message instead.
- Buttons to `/dashboard`, `/leaderboard`, and a points-history view (6.5).

Core actions on this page:
- **Task code entry:** a single input field "Zadej kód úkolu" + submit, **plus** a "Naskenovat QR" button that opens the device camera (a small client-side QR-scanning library such as `html5-qrcode` is enough — no server round trip needed to *read* the code). Either path lands on the same lookup. The page should also read a `?code=` query param on load and auto-fill/submit it, since each task's QR just encodes a URL like `https://yourapp.vercel.app/game?code=XXXX` (admin generates this — see 7.1).
  - On submit, look up an **active** `Task` by `taskCode`.
    - Not found / inactive → friendly error, no crash.
    - Found → open a **modal** showing `taskText`, with two buttons: **"Splnil/a jsem"** (completed) and **"Zrušit"** (cancel). If the device has a camera, also offer an *optional* photo attachment in this same modal — it's never required to complete the task, it's just captured alongside it (`TaskCompletion.photoUrl`) so admin can later pick it, add a caption, and feature it on the dashboard (see 7.4).
    - On "Splnil/a jsem": server re-checks the task is still active and that this player hasn't exceeded their allowed completions for its `repeatability` (`ONCE` → max 1, `MULTIPLE` → max `maxCompletions`, `UNLIMITED` → no cap). If OK, create a `TaskCompletion` (with the optional photo), add `taskPoints` to the player (see the public-quest exception below), write a `PointsLedgerEntry` (source `TASK`) so it shows up in points history, and show a success animation (points +N, torch flicker).
    - If the completion limit is already reached, show a clear Czech message instead of silently failing.
  - **Public quest exception (`isPublicQuest = true`):** completing this type of task does **not** add points to the player directly. Instead it opens a second step where the player picks another player from a list and a points amount (up to `taskPoints`) to **gift** them (creates a `PointsTransfer` and a `PointsLedgerEntry` for the recipient, deducts nothing from the sender — the points come from the quest reward pool). *(This models your "make a drink for someone, then you can send them points" example — flagged as a design assumption in Section 11, adjust if you meant something different.)*
- **Setup / profile questions:** a small section listing any active `SetupQuestion`s the player hasn't answered yet. Submitting an answer:
  1. Creates a `QuestionAnswer`.
  2. Creates a `DashboardPost` (text = the answer, playerId = the player) so it appears on the dashboard.
  3. Awards the question's `points` to the player, with a `PointsLedgerEntry` (source `SETUP_QUESTION`).
- **Active voting widget:** if there's an active `Voting` this player is eligible for (via scope: ALL / their TEAM / a CUSTOM_GROUP they're listed in) and they haven't voted yet, show it prominently:
  - `YES_NO` → two buttons, Ano / Ne.
  - `MULTIPLE_CHOICE` → list of `VoteOption`s as buttons/radio.
  - `PLAYER_SELECT` → list of `VoteCandidate` players to pick one.
  - After voting, replace with "Děkujeme, tvůj hlas byl zaznamenán" (thanks, your vote was recorded) — don't show live results to players unless you decide otherwise (that's an admin-side tool by default, see 7.5).
  - Poll `/api/voting/active` every ~5–8s so a newly started vote appears without a manual refresh.
- **Betting widget** — see 6.4.

### 6.3 Leaderboard (`/leaderboard`)
- Two ranked lists, live-polled every ~10s:
  - **Players** — all players sorted by `points` descending, showing rank, photo, name, team badge, points.
  - **Teams** — teams sorted by the sum of their members' points.
- Highlight the current player's own row (and their team) so it's easy to spot at a glance on a phone.
- Reachable from `/`, `/game`, and `/dashboard`.

### 6.4 Betting (part of `/game`)
- If there's an open `BettingRound` (`isOpen = true`, `isResolved = false`), show a card: "Sázky: [Tým A] vs. [Tým B]" listing all 6 `BettingCandidate` players (photo + name + team badge).
- Tapping a candidate places (or updates, while still open) the player's `Bet` for that round — one bet per player per round, enforced by the schema's unique constraint. Show a confirmation: "Vsadil/a jsi na: [jméno]".
- Once admin closes betting (`isOpen = false`) but hasn't resolved yet, show "Sázky jsou uzavřené, výsledek brzy" instead of the picker.
- Once admin resolves it (`isResolved = true`), show the result and, if this player bet correctly, a "Vyhrál/a jsi sázku! +N bodů" callout (also delivered as a push notification if the player opted in — see 6.7).
- Poll `/api/betting/active` alongside the voting widget.

### 6.5 Points history (section on `/game`, or its own `/game/history` view)
- Reverse-chronological list of the current player's `PointsLedgerEntry` rows: date, delta (+/-), and a Czech label derived from `source` (Úkol, Veřejný úkol — dar, Otázka, Sázka, Úprava administrátorem), plus the free-text `note` when present.
- This is what makes point totals feel trustworthy — nobody has to take "you have 47 points" on faith.

### 6.6 Dashboard (`/dashboard`)
- Reverse-chronological feed of `DashboardPost`s (admin posts + player-submitted answers + admin-curated task photos), each with photo (if any), text, author name/photo (unless `isSystem`), and relative timestamp.
- **"Release" animation:** new posts shouldn't just pop in — poll for new posts (or use Framer Motion `AnimatePresence`) and reveal each new one with a short suspenseful entrance (e.g. a "torch light sweeping across" / flip / fade-and-rise effect) rather than an instant append, echoing a tribal-council-style reveal.
- Accessible from `/`, `/game`, and `/leaderboard`.

### 6.7 PWA & push notifications (mainly for `/game`)
- `manifest.json`: app name "Survival Party", short_name, theme/background colors matching the jungle/fire palette, icons (192px, 512px, maskable).
- Service worker (via `next-pwa` or hand-written) caching the app shell so the game page loads even on a flaky connection; data itself (points, tasks) still needs network, but the UI shouldn't go blank.
- "Add to home screen" should work cleanly on both iOS Safari and Android Chrome — test both; note that iOS Safari **does** support web push for installed PWAs (since iOS 16.4), but only after the app has actually been added to the home screen and the person has granted notification permission from *within* the installed app, not the Safari tab.
- **Push notifications:** after installing, the game page asks permission and, if granted, subscribes via the browser Push API and posts the subscription to `/api/push/subscribe` (stored as a `PushSubscription`). Server-side, use `web-push` with a pair of VAPID keys (generate once, store as env vars) to send a notification whenever admin: opens a new task, starts a voting, opens or resolves a betting round, or posts to the dashboard. Keep the list of triggers tight — see the note in Section 11.

---

## 7. Admin features (`/admin`, password-protected)

### 7.1 Task management
- Form to create a task: `taskText`, `taskPoints`, `taskCode` (let admin set it manually, but validate uniqueness — a short memorable code is the point), `repeatability` (ONCE / MULTIPLE incl. a count / UNLIMITED), `isPublicQuest` toggle.
- Each task in the list also shows a **QR code**, generated client-side with the `qrcode` package (no server call needed) encoding a link to `/game?code=<taskCode>` — with a "Stáhnout QR" button so it can be printed and posted next to the plain-text code at a physical location.
- List of tasks with status; a **"Zrušit úkol"** (cancel/deactivate) button per task that flips `isActive` to false — don't hard-delete, so completion history stays intact.
- A view of who has completed which task and when (from `TaskCompletion`), including any attached photos.

### 7.2 Points tool
- Select one or more individual players (multi-select) **or** an entire team, enter a point delta (positive or negative) and an optional reason, apply — each application also writes a `PointsLedgerEntry` (source `ADMIN_ADJUSTMENT`) per affected player. Two clearly separate buttons/tabs: "Body hráči/hráčům" and "Body celému týmu".

### 7.3 Team management
- Create/rename/recolor teams.
- Assign or reassign each player to a team (dropdown or drag-and-drop list), with an "unassigned" bucket for new players.

### 7.4 Dashboard management
- Create a post as admin/system (`isSystem = true`), with text + optional photo.
- Edit/delete any post (including player-submitted ones), for moderation.
- **Photo gallery from task completions:** browse `TaskCompletion.photoUrl` entries (newest first, shown with the player's name and the task text for context), pick one, write your own caption, and publish it as a new `DashboardPost` — this is how the optional task photos actually reach the dashboard (they're never posted automatically).

### 7.5 Voting tool
- Create a voting: `question` text, `voteType` (yes/no, multiple choice with a dynamic add/remove options list, or player-select), `scope` (all / one team / a custom hand-picked group of players), and — only for `PLAYER_SELECT` — which players are selectable **candidates** (not necessarily the same set as who's eligible to vote).
- Start/stop toggle (`isActive`, i.e. "vote_is_up") — starting it is what makes it appear on eligible players' `/game` pages.
- Live results view for the admin (counts per option / yes-no split / per-candidate tally), and a "Zavřít hlasování" (close voting) action.

### 7.6 Betting tool
- **Create a round:** pick Team A and Team B (from existing teams), pick the 3 candidate players from each side (6 total), set `rewardPoints` (how many points a correct bet earns), optional `title`. Saving it opens the round (`isOpen = true`) and it immediately shows up in players' betting widgets.
- **"Uzavřít sázky" (close betting):** flips `isOpen` to false — no new or changed bets accepted from this point. Meant to be pressed right before the physical challenge starts.
- **"Vyhodnotit sázky" (resolve):** after the challenge, admin checks off which of the 6 candidates actually turned out to be the best (typically one per team, but the tool doesn't hard-limit it) and submits. This creates the `BettingWinner` rows, sets `isResolved = true`, and the server automatically pays `rewardPoints` to every player whose `Bet.candidateId` matches a winner (adds to `Player.points`, writes a `PointsLedgerEntry` with source `BETTING_WIN`, and sends a push notification to each winner if they've subscribed).
- A list of past rounds with their results, for reference.

---

## 8. Suggested API routes

| Method & path | Purpose |
|---|---|
| `POST /api/auth/login` | `{ name }` → find-or-create player, set session cookie |
| `GET /api/me` | current player: name, points, photo, team + teammates |
| `POST /api/upload` | file → uploads to **Vercel Blob**, returns a URL to store in `Player.photoUrl` / `DashboardPost.photoUrl` / `TaskCompletion.photoUrl` |
| `POST /api/tasks/complete` | `{ taskCode, completed, photoUrl? }` → validates, applies points (writes a ledger entry) or opens the gift flow |
| `POST /api/points/transfer` | `{ toPlayerId, points, reason }` → public-quest point gifting |
| `GET /api/points/history` | current player's `PointsLedgerEntry` list, newest first |
| `GET /api/leaderboard` | ranked players + ranked teams by total points |
| `GET /api/questions` | active setup questions not yet answered by current player |
| `POST /api/questions/:id/answer` | `{ answerText }` → saves answer, creates dashboard post, awards points |
| `GET /api/dashboard` | list dashboard posts (paginated) |
| `GET /api/voting/active` | current active voting this player is eligible for, if any |
| `POST /api/voting/:id/respond` | `{ answer }` → records this player's vote |
| `GET /api/betting/active` | open/recently-resolved betting round(s) visible to this player |
| `POST /api/betting/:id/bet` | `{ candidatePlayerId }` → place/update this player's bet |
| `POST /api/push/subscribe` | `{ endpoint, keys }` → saves a `PushSubscription` for the current player |
| `POST /api/admin/login` | `{ password }` → sets admin session cookie |
| `GET/POST /api/admin/tasks` | list / create tasks |
| `PATCH /api/admin/tasks/:id` | deactivate ("cancel") a task |
| `POST /api/admin/points/adjust` | `{ playerIds[] \| teamId, points, reason }` |
| `GET/POST/PATCH /api/admin/teams` | manage teams, assign players |
| `POST/PATCH/DELETE /api/admin/dashboard/:id?` | manage dashboard posts |
| `POST /api/admin/dashboard/from-photo` | `{ taskCompletionId, text }` → creates a dashboard post from a task-completion photo |
| `POST /api/admin/voting` | create + start a voting |
| `GET /api/admin/voting/:id/results` | live tally |
| `PATCH /api/admin/voting/:id/close` | close a voting |
| `POST /api/admin/betting` | create + open a betting round (teams, 3+3 candidates, reward) |
| `PATCH /api/admin/betting/:id/close` | close betting (no more new/changed bets) |
| `POST /api/admin/betting/:id/resolve` | `{ winnerPlayerIds[] }` → marks winners, pays out, notifies |

---

## 9. Czech UI glossary (for consistency)

| Key | Czech text |
|---|---|
| Name field | Tvoje jméno |
| Login/register button | Vstoupit do hry |
| Points | Body |
| Team | Tým |
| No team yet | Zatím nejsi v žádném týmu |
| Task code field | Zadej kód úkolu |
| Scan QR | Naskenovat QR |
| Task completed button | Splnil/a jsem |
| Cancel button | Zrušit |
| Task limit reached | Tento úkol už jsi splnil/a maximální počet krát |
| Send points | Poslat body |
| Leaderboard | Žebříček |
| Points history | Historie bodů |
| Dashboard / feed | Nástěnka |
| Voting | Hlasování |
| Vote yes/no | Ano / Ne |
| Thanks for voting | Děkujeme, tvůj hlas byl zaznamenán |
| Betting section | Sázky |
| Place a bet | Vsadit |
| You bet on ... | Vsadil/a jsi na |
| Betting closed | Sázky jsou uzavřené |
| You won the bet | Vyhrál/a jsi sázku! |
| Enable notifications | Povolit oznámení |
| Admin area | Administrace |
| Admin password field | Heslo správce |
| Cancel task (admin) | Zrušit úkol |
| Give points | Přidat body |
| Give points to whole team | Body celému týmu |
| Start voting | Spustit hlasování |
| Close voting | Zavřít hlasování |
| Close betting (admin) | Uzavřít sázky |
| Resolve betting (admin) | Vyhodnotit sázky |
| Setup question section | Doplň info o sobě |

---

## 10. Build order (recommended phases for Copilot)

Work through these one at a time (one Copilot Agent-mode session per phase works well) rather than asking for the whole app at once:

1. **Scaffold** — `create-next-app` (TS, App Router, Tailwind, ESLint), install Prisma, `next-pwa`, `framer-motion`, `jose`, `swr`, `@vercel/blob`, `qrcode`, `web-push`.
2. **Schema & seed** — add the Prisma schema from Section 4, run the first migration, write a `seed.ts` with a couple of test teams, tasks, and players.
3. **Auth** — name-only login/register endpoint + cookie session + middleware protecting `/game` and `/admin`.
4. **Player main page** — profile card, team/teammates, task-code entry (text field + QR scan + `?code=` prefill) + modal with optional photo + completion logic.
5. **Quests, questions & the points ledger** — public-quest point-gifting flow, setup-question form → dashboard post, and wire *every* points-changing action (tasks, quests, questions) to also write a `PointsLedgerEntry`.
6. **Leaderboard & points history** — `/leaderboard` and the points-history view, both reading off `Player.points` / `PointsLedgerEntry`.
7. **Dashboard** — feed + reveal animation + polling.
8. **Voting (player side)** — active-voting widget + response submission.
9. **Betting (player side)** — betting widget on `/game`.
10. **PWA & push notifications** — manifest, icons, service worker, VAPID keys, subscribe flow, server-side sends on the key admin actions.
11. **Admin panel** — login, then tasks (incl. QR generation) / points / teams / dashboard (incl. the photo-gallery-to-post tool) / voting / betting screens, in that order.
12. **Visual pass** — apply the palette/typography/motion from Section 3 across everything, responsive check on phone widths.
13. **Deploy to Vercel** — push to GitHub, import the repo in Vercel, add **Neon** from the Storage tab (injects `DATABASE_URL`/`DATABASE_URL_UNPOOLED`), add **Vercel Blob** the same way, set `ADMIN_PASSWORD` and the VAPID keys under Environment Variables, run `npx prisma migrate deploy` against the DB, then walk through the whole flow — including "add to home screen" and a push notification — on a real phone before the event.

---

## 11. Assumptions flagged for you to confirm/adjust

A few details in your brief were open to interpretation — here's what was assumed, so you can correct anything before Copilot builds it:

- **Public quest reward mechanic:** assumed completing an `isPublicQuest` task lets the player gift its point value to someone else, rather than keeping the points themselves. If you actually meant "player gets the points AND can additionally send some of their own points to someone," say so and the flow just needs a small tweak.
- **"Team" needs its own table**, not just a text field on `Player`, so it can have a name/color and so admin tools like "give points to a whole team" work cleanly.
- **Dashboard "release" animation** interpreted as an animated reveal for new posts appearing in the feed (tribal-council style), not a scheduled/timed release of pre-written posts — clarify if you meant the latter.
- **Voting results visibility to players** defaulted to "hidden until admin closes/reveals them" — flip this if players should see live results.
- **Admin auth** is a single shared password (env var), not per-admin accounts — fine for one trusted organizer, say if you need multiple distinct admin logins.
- **Task photos are decorative, not a gate:** confirmed per your note — attaching a photo never blocks or delays the point award, it's purely optional and only ever reaches the dashboard if admin manually picks it and adds a caption.
- **Betting has no stake:** placing a bet costs the bettor nothing, and a wrong bet loses nothing — only correct bets earn the round's flat `rewardPoints`. Say so if you actually want players to wager their own points (win more / lose what you staked).
- **Betting winners:** the admin tool lets you mark any number of "best players" as winners, but the natural use is one per team (2 total), matching "insert best players from both teams."
- **Push notification triggers** assumed to be: new task, new voting, new/resolved betting round, and new dashboard post. Trim this list if that's too chatty for a weekend event — over-notifying is the fastest way for people to mute the app.