# commit. — how this was built

This walks through the project the same order it was built, and why each
piece exists. Read it alongside the actual files — it won't make much sense
on its own.

## 1. Project setup

- **`package.json`** — React 19, `react-router` (v8 — note this is `react-router`,
  not `react-router-dom`; that package was discontinued in v8), and Vite 7.
- **`vite.config.ts`** — registers two plugins: `@vitejs/plugin-react` (JSX
  support) and `@tailwindcss/vite` (Tailwind v4's Vite integration, which
  replaces the old PostCSS config file entirely).
- **`index.html`** — the actual HTML shell. This is also where the Inter and
  JetBrains Mono fonts get loaded via a `<link>` tag — Tailwind's `@theme`
  block (next) only tells Tailwind what to *call* the fonts, it doesn't load
  them.
- **`src/index.css`** — this is the whole design system in one place. The
  `@theme` block defines every color, using v4's CSS-first config instead of
  a `tailwind.config.js`. `--color-accent` here is what makes `bg-accent`,
  `text-accent`, `border-accent` all valid Tailwind classes elsewhere —
  Tailwind auto-generates the utilities from the token names.

**Why this order:** nothing else can be built until the tokens exist. Every
component below only ever references a token name (`bg-surface`,
`text-code-keyword`), never a raw hex value — that's the whole point of
doing this step first.

## 2. Shared components — built before any page

- **`Button.tsx`** — one component, two jobs. If it gets a `to` prop, it
  renders as a `<Link>` (real navigation, no logic first). Otherwise it's a
  plain `<button>` that calls `onClick`, for the cases where something has
  to happen (an API call, a validation check) before navigating. This
  distinction matters: nesting a `<button>` inside an `<a>` isn't valid
  HTML, so the component picks one or the other rather than being both.
- **`Logo.tsx`** — trivial on purpose. It exists mainly so "commit." isn't
  retyped with slightly different classes on six different pages.
- **`CodeBlock.tsx`** — the terminal-style panel frame (the three dots + the
  language tag). It only provides the *frame* — each page passes its own
  colored `<span>` content as children, since the code shown differs per
  screen (the landing easter egg vs. the actual confession vs. the decrypt
  line).

**Why build these first:** every page below imports all three. Building
pages before these existed would have meant writing the same button and
code-block markup six times, then fixing it six times every time something
about the design changed.

## 3. The pages, in build order

Each page follows the same internal order: read/derive state → layout →
event handlers.

1. **`Landing.tsx`** — no state, no form. `flex-col md:flex-row` is the
   entire mobile-to-desktop story here: same two children, stacked below
   the `md` breakpoint, side-by-side above it.
2. **`CreateConfession.tsx`** — the first page with real state (`message`,
   `language`). `canContinue` gates the button's `disabled` prop, so the
   enabled/disabled visual states from the design system map directly onto
   real form validity instead of being purely decorative. The language
   picker's `grid-cols-2 md:grid-cols-3` plus a `col-span-2 md:col-span-1`
   on the third card is what produces the mobile "2+1" layout that becomes
   an even 3-up row on desktop.
3. **`Preview.tsx`** — reads `message`/`language` back out of
   `location.state`, which is how the draft survives the trip from the
   previous page without a backend yet. This breaks on a hard refresh
   (route state doesn't persist), which is fine for now and is exactly what
   a real save-confession API call will fix later.
4. **`Send.tsx`** — phone number input; `handleSend` is where the real SMS
   call belongs eventually.
5. **`Status.tsx`** — the `status` value is currently hardcoded to
   `"pending"`. This is the clearest stand-in in the whole project for
   "this needs a backend" — it's meant to be replaced with a real fetch.
6. **`Recipient.tsx`** — `useParams()` pulls the `:id` out of the URL
   (`/r/:id`), which is where a real "fetch confession by id" call will
   plug in. The response buttons update local state only for now; nothing
   is sent anywhere yet.

## 3b. The encoding system (added after the initial build)

Originally every language option just showed base64 with a different label
— not a real difference. This is what replaced that:

- **`src/lib/encoding.ts`** — `encodeMessage()` / `decodeMessage()`, one real
  algorithm per language: base64 (`btoa`/`atob`) for JS, ROT13 for Python
  (a genuine Python one-liner: `codecs.decode(s, "rot13")`), hex for
  Terminal (`xxd`-style). ROT13 is its own inverse, so encode and decode
  reuse the same function for that one.
- **`src/lib/languages.ts`** — the four options' display info (icon, name,
  tagline, code-block tag), used by the picker on `CreateConfession` and by
  both reveal screens, so there's one source of truth instead of the pickers
  and the reveal logic drifting apart.
- **`src/components/EncodedLines.tsx`** — renders the two code lines in each
  language's actual syntax (`const x = ...;` for JS, no semicolons for
  Python, a `$`-prefixed shell line for Terminal), shared between
  `Preview.tsx` and `Recipient.tsx` so they can't disagree about what a given
  language "looks like."
- **"Plain text"** is the fourth option — chosen at creation, baked into the
  confession. When it's selected, `Preview.tsx` and `Recipient.tsx` both skip
  the code block and Run button entirely and just show the message. This was
  a deliberate choice about *when* this gets decided: it happens once, at
  creation, not as a per-viewing toggle — see the `isPlain` branches in both
  files.
- **The word-by-word reveal** on `Recipient.tsx` (`revealedCount` +
  `useEffect`) streams the decoded message in over time rather than
  swapping the whole thing in at once, so clicking Run feels like watching
  something execute rather than an instant text swap.

## 4. What's deliberately left stubbed

Every `TODO` comment in the code marks a point where a real backend call
replaces a placeholder. Specifically, nothing here yet:

- saves a confession or generates a real unique link
- sends an SMS through a provider (needs something like Twilio, with your
  own sender ID — a browser can't spoof who a text is "from")
- fetches a confession by its link id
- records a response or flips the sender's status
- runs the "keep nudging until they respond" reminder logic

All of that is backend/API work, separate from what's in this repo.

## 5. Running it

```
npm install
npm run dev
```

If `npm install` complains about peer dependencies, your Node/React
versions may be behind what React Router v8 expects (Node 22.22+, React
19.2.7+) — `npm install react-router-dom@7` is the fallback if you'd rather
not upgrade those yet.

## 6. Connecting to the backend

`src/lib/api.ts` is the one file that knows how to talk to the FastAPI
backend — every page imports functions from here rather than calling
`fetch()` directly, so there's one place to change if the API's shape ever
changes.

- **`VITE_API_BASE_URL`** (in `.env`, copy from `.env.example`) — defaults
  to `http://localhost:8000` if you don't set it, matching the backend's
  default port.
- **The confession is only saved when "Generate link" is clicked** on
  `Preview.tsx` — not on `CreateConfession.tsx`. Everything before that is
  still just route state, nothing hits the backend until the sender
  actually confirms they want to send it.
- **`localStorage` holds the sender's last confession id** (set in
  `Send.tsx`), which is what lets `Status.tsx` still work after a page
  refresh — route state alone doesn't survive that. This is a much smaller
  use of localStorage than the "bridge" discussed earlier: it's just one id
  for convenience, not a substitute for the real backend.
- **Every page that calls the API has a loading and/or error state now**
  (`Recipient.tsx` most visibly — `stage` includes `"loading"` and
  `"error"`) since a real network call can actually fail, unlike the old
  hardcoded placeholders which couldn't.

