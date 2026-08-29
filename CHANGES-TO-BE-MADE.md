# Changes To Be Made

Outstanding work on the Team Asterix site, ordered by how much it costs to leave
alone. Everything here is known and deliberate — none of it is blocking the
current deploy.

Last updated: 2026-08-29

---

## 1. Deployment

### 1.1 Front end — done
The site is live at https://asterix-website.vercel.app. Vercel is connected
through its own Git integration and deploys automatically on every push to
`main`. There is no `vercel.json`; build settings live in the Vercel dashboard.

GitHub Actions still runs lint and build in parallel with that, which is worth
keeping — it gates pull requests, and Vercel does not run oxlint.

Two things are worth adding when there is time:
- A `vercel.json` so build settings are in version control rather than only in
  the dashboard.
- SPA rewrites, if deep links are ever added. The app is currently a single
  route with hash-based admin, so nothing is broken today.

### 1.2 The backend has nowhere to live
`server/` is Express + `node:sqlite` + local disk uploads. It runs only on a
developer machine. Until it is hosted:

- `/api/site-data` 502s in production, and the site silently falls back to
  `localStorage` defaults.
- The admin dashboard at `#admin` cannot persist anything across devices.
- Uploaded gallery images live in `server/uploads/` on one machine.

Hosting it needs a persistent disk (Fly.io volume, Render disk, or a VPS) —
`node:sqlite` and the uploads directory are both filesystem-backed, so a
stateless container will lose data on every restart.

### 1.3 Secrets
`server/.env.example` ships `JWT_SECRET=your_jwt_secret_key_here`. A real
secret has to be generated and set in the host's environment before the admin
login is exposed to the internet. Do not commit it.

---

## 2. Correctness

### 2.1 `set-state-in-effect` warnings (5 sites)
`.oxlintrc.json` holds `react/set-state-in-effect` at `warn` because the whole
`correctness` category is otherwise `error` and these predate this work:

- `src/App.jsx:53`
- `src/components/TeamGallery.jsx:20`
- `src/components/DriftWall.jsx:74`
- `src/context/WebsiteDataContext.jsx:269`
- `src/components/admin/AdminDashboard.jsx:298`

Several are legitimate `matchMedia` subscriptions. `WebsiteDataContext` and
`AdminDashboard` are the ones worth restructuring. Once clean, promote the rule
back to `error` and add `--deny-warnings` to the CI lint step.

### 2.2 `ModelViewer` calls hooks inside `useMemo`
`src/components/ModelViewer.jsx` calls `useGLTF` / `useFBX` / `useLoader`
conditionally inside a `useMemo`, which is why the file carries
`/* eslint-disable react-hooks/rules-of-hooks */`. It never fires today because
`url="baja"` short-circuits to the procedural model, but it will break the
moment a real `.glb` is passed. Split into per-format components chosen by the
parent.

### 2.3 `CardSwap` deck resizing
Fixed so a changed deck size re-seeds correctly, but the design still rebuilds
every `createRef` when the child count changes. Keying the cards by subsystem id
would be sturdier than keying by index.

---

## 3. Performance

### 3.1 Bundle is 1.7 MB (494 KB gzipped) in one chunk
Almost entirely `three` + `@react-three/*`. The 3D inspector is a separate
route that most visitors never open.

```js
const BajaModelPage = lazy(() => import('./components/BajaModelPage'));
```

That alone should move several hundred KB off the landing path. `AdminDashboard`
(1500 lines) should be lazy too — it is behind `#admin`.

### 3.2 Gallery images are ~1 MB each
`public/gallery/*.jpg` are 920 KB – 1.1 MB apiece, six of them, all fetched for
the drift wall. Convert to WebP at ~1600px wide and add `srcset`. Expect ~85%
saved. `scripts/extract-intro-frames.py` shows the WebP encoding pattern.

### 3.3 Intro sequence weight
`public/intro/` is 3.1 MB across 112 frames. Acceptable for a hero, but if the
budget tightens: lower the WebP quality from 82/80 to ~70, or trim the arc to
start closer to the three-quarter it lands on.

---

## 4. Accessibility

- **Intro has no skip control.** A keyboard user scrolls through ~2.5 viewports
  before reaching content. Add a visually-hidden "skip intro" link that focuses
  the hero.
- **`select-none` is applied to whole sections**, which blocks text selection
  for people who copy content to translate or read in another tool. Scope it to
  the decorative layers.
- **Colour contrast is unverified.** `text-slate-500` on white is roughly 4.0:1,
  under the 4.5:1 minimum for body text. Audit the muted greys.
- **The navbar now hides on scroll**, so it no longer sits as a light bar over
  the intro's dark footage. That also means it is unreachable without scrolling
  back up — worth confirming it reappears on upward scroll for keyboard and
  screen-reader users, not only on a scroll-to-top.

---

## 5. Content and data

- **Gallery metadata is placeholder.** `location` and `date` default to
  `"SAEINDIA Circuit & Workshop"` / `"2026"` for every photo.
- **`DriftWall` and `AccordionGallery` still ship `picsum.photos` defaults.**
  Harmless while real items are always passed, but they are a live third-party
  request if either ever renders without props.
- **`public/icons.svg`** is untouched Vite boilerplate (bluesky/discord/x
  symbols). Nothing imports it. Delete.
- **The intro clip is AI-generated** and carried a generator watermark, cropped
  out during extraction. Worth replacing with real footage of the actual car
  before the site is used for sponsor outreach.

---

## 6. Testing

There is no test suite. The backend CI job only checks that modules parse and
the schema boots. Worth adding, cheapest first:

1. Vitest + Testing Library over `WebsiteDataContext` (merge/fallback logic is
   the most load-bearing untested code in the repo).
2. A Playwright smoke test: load the page, scroll past the intro, assert the
   hero and each section render.
3. API tests for `server/src/routes/*` — auth in particular.

---

## 7. Known-good, do not "fix"

Recorded so nobody undoes them:

- **`index.html` has no `scroll-smooth`.** Lenis drives smooth scrolling; a CSS
  `scroll-behavior` on the root fights it and ScrollTrigger.
- **The intro stage is `position: fixed`, not `sticky`.** The app root and
  `body` both set `overflow-x: hidden`, which per spec makes the other axis
  compute to `auto` — that turns the ancestor into a scroll container and
  silently breaks `sticky`.
- **The `#intro` section has no background colour.** The dark backdrop is
  painted by the frame canvas, so fading that canvas out at the end reveals the
  live 3D scene behind it. Putting `bg-slate-900` back turns the cross-dissolve
  into a hard cut again.
- **`introHandoff` is a plain mutable object, not React state or context.** It
  changes on every scroll frame; routing it through React would re-render the
  whole background tree at scroll rate.
- **The 3D buggy's orientation ignores the cursor.** Mouse-driven yaw and pitch
  let the reader rotate it into angles the scroll choreography was never posed
  for. Only a small positional drift remains.
- **The contact shadow tracks the vehicle's staged `y`.** Without it the shadow
  hangs in the air above the car on portrait viewports, where the keyframes drop
  the vehicle well below world zero.
- **The `DriftWall` plane has no `press` utility.** Its transform is rewritten
  every frame; an `!important` `:active` transform would flatten the wall on
  mousedown.
- **`--font-sans` / `--font-mono` are set in `@theme`, not just on `body`.**
  Tailwind's `font-sans` utility on the app root otherwise overrides the body
  rule and the site falls back to system fonts.
- **The marquee gap lives on each item, not the flex track.** A gap on the track
  makes `translateX(-50%)` land half a gap short, which shows as a jump once per
  loop.
