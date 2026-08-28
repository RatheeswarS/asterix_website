# Changes To Be Made

Outstanding work on the Team Asterix site, ordered by how much it costs to leave
alone. Everything here is known and deliberate — none of it is blocking the
current deploy.

Last updated: 2026-08-28

---

## 1. Blocking a real deployment

### 1.1 No deploy target is configured
CI lints, builds and uploads `dist/` as an artifact. Nothing publishes it.

Pick one and wire a deploy job into `.github/workflows/ci.yml`:

| Option | Fits because | Needs |
|---|---|---|
| Cloudflare Pages | free, fast for a static SPA | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` |
| Vercel | zero-config for Vite | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| GitHub Pages | no third party | `actions/deploy-pages`, and `base` set in `vite.config.js` |

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
saved. `scripts/extract-intro-frames.ps1` shows the ffmpeg pattern.

### 3.3 Intro sequence weight
`public/intro/` is 4.1 MB across 160 frames. Acceptable for a hero, but if the
budget tightens: drop desktop to every 4th frame (60 frames) or lower the WebP
quality from 74 to ~66.

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
- **The navbar sits over the intro's dark footage** as a light bar. It works,
  but a transparent-over-dark treatment during the intro would look deliberate.

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
- **The `DriftWall` plane has no `press` utility.** Its transform is rewritten
  every frame; an `!important` `:active` transform would flatten the wall on
  mousedown.
- **`--font-sans` / `--font-mono` are set in `@theme`, not just on `body`.**
  Tailwind's `font-sans` utility on the app root otherwise overrides the body
  rule and the site falls back to system fonts.
- **The marquee gap lives on each item, not the flex track.** A gap on the track
  makes `translateX(-50%)` land half a gap short, which shows as a jump once per
  loop.
