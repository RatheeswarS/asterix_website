# How the recruitment portal works

The crew-selection portal is **static**. Applications are taken through the
team's Google Form; this repository only renders the material around that form —
the induction timeline, a live countdown to the next deadline, and the
per-subsystem problem statements — and gives the leads an admin tab to edit
them.

There is no application API, no status lookup, no team draw and no stored
applicant data in this codebase. The earlier custom pipeline (apply / lookup /
submit / random team draw, backed by its own Mongo collections) was removed
deliberately: the Google Form does the job the team actually needs, and the
static portal works with or without a backend.

Last verified: 2026-09-02

---

## 1. Where the content lives

All of it is one field on the site-data blob: **`siteData.recruitment`**. It
rides the same storage, sync and offline-fallback path as every other section
(hero, gallery, story…), so the portal works from the bundled defaults even with
no backend, and an admin edit appears on the live site within one poll.

```
recruitment: {
  headline,            // badge above the hero title
  intro,               // hero paragraph
  notice,              // optional highlighted banner; blank hides it
  applyUrl,            // Google Form URL; blank falls back to hero.joinFormUrl
  applyLabel,          // text on the Apply buttons
  timeline: [          // induction milestones
    { id, label, detail, date }   // date: ISO string pinned to +05:30 IST
  ],
  problemStatements: [
    { id, subsystem, title, summary, body, fileUrl }
  ]
}
```

No dates are seeded. An empty `timeline` hides the countdown rather than showing
an invented date; empty `problemStatements` shows a "stay tuned" note. The shape
is normalised in `WebsiteDataContext` (`normalizeRecruitment`) so a document
written before this field existed, or a restored backup, always reads back with
both lists present.

---

## 2. What renders it

- **`src/components/RecruitmentPage.jsx`** — the public portal at `#join` /
  `#recruitment`. Reads `siteData.recruitment`, maps the timeline into the
  countdown engine, lists the problem statements as cards, and points every
  Apply button at the Google Form.
- **`src/components/RecruitmentCountdown.jsx`** — the countdown / timing tower
  (reused unchanged): "next deadline on the board", a per-milestone schedule,
  and a compact strip that docks under the header once the board scrolls past.
- **`src/components/admin/RecruitmentAdmin.jsx`** — the `#admin → Recruitment
  Portal` tab. Edits the fields above through the shared `WebsiteDataContext`;
  there is no separate endpoint or token.
- **`src/lib/istTime.js`** — converts between the stored `+05:30` ISO strings
  and the `datetime-local` inputs, and formats deadlines in IST.

---

## 3. Editing a cycle

1. Open `#admin → Recruitment Portal`.
2. Set the headline, intro and (optionally) the notice banner.
3. Confirm the Google Form URL, or leave it blank to reuse the Hero tab's Join
   Form URL.
4. Add timeline milestones — at least the problem-statement submission deadline.
   The countdown targets the next future milestone automatically.
5. Add one problem statement per subsystem (or as many as you need). Nothing is
   public until you add it here.
6. Edits save through the normal debounced sync; **☁ Sync Cloud** pushes
   immediately.

---

## 4. Persistence & environment (why an edit sometimes "doesn't stick")

The portal is static content, but *persisting* an edit still needs the same
backend as the rest of the site:

| Variable | Needed for | Without it |
|---|---|---|
| `MONGODB_URI` | Saving any admin edit | Edits live only in that browser's `localStorage`; they never reach other devices |
| `JWT_SECRET` | Admin login | Falls back to a random dev key; sessions reset on restart. **Set this before exposing the admin.** |
| `IMAGEKIT_*` | Durable image uploads | Uploads refused; admin falls back to a low-res inline copy |
| `CORS_ORIGIN` | Browser access from the site | Defaults to localhost + the known Vercel origins |
| `VITE_API_URL` | Frontend → API (build time) | Production falls back to the known Render URL |

**Images specifically.** `POST /api/upload` sends the file to ImageKit (needs
the three `IMAGEKIT_*` keys) or to a persistent disk at `UPLOADS_DIR`; on a plain
container with neither, it refuses and the admin stores a compressed inline copy
instead, saying so on screen. The image bytes **never** go to MongoDB — MongoDB
only stores the resulting URL string. So a reliable admin image needs *both*:
ImageKit (where the file lives) **and** `MONGODB_URI` (where the record naming it
is saved). That is why an uploaded photo can appear once and then vanish: the
file landed on an ephemeral disk, or the record was only in one browser.
`GET /api/upload/status` reports which of these is live without exposing a
secret.

---

## 5. Engineering badges

Not recruitment, but the other end of the same thread: what a member takes with
them when they leave.

It is deliberately small. A **downloadable PNG**, drawn in the member's own
browser, and nothing else — no hosted page, no route, no API, no identifier to
look up. What a member actually wants is an image they can put in a post or a CV.

- **Where.** Each member card on a subsystem page carries **Download badge**.
- **How.** `src/lib/badgeImage.js` draws to a canvas and saves a PNG. 900×480,
  multiplied by the device pixel ratio so it stays crisp in a slide or a PDF.
- **What it says.** Portrait, name, role, subsystem, the specialist tag, and an
  ALUMNI or ACTIVE CREW chip — everything already on the roster, so a badge is
  never out of date with the site.
- **Cropping.** `drawFramed` reimplements `object-fit` / `object-position` as
  canvas source-rectangle maths, so the badge crops a photo exactly the way the
  website does.

Two failure modes are handled explicitly rather than left to the console:

- **A photo that will not load** falls back to an initials block.
- **A photo served without permissive CORS headers taints the canvas**, and the
  error surfaces only at `toBlob`. The button reports it in words and says to
  re-upload through the admin so the file lands on the CDN. `crossOrigin` is set
  before `src`, which is the only order that works.

Webfonts are awaited via `document.fonts.ready` before drawing, so the badge
never silently falls back to the system font stack.

---

## 6. Things that look wrong but are not

- **The countdown keeps ticking after the last deadline**, slowly. Tearing the
  interval down froze the clock at mount, and a tab left open across a boundary
  went on showing a closed milestone as live.
- **Site content polls every 3.5 s.** It is a small blob the admin edits
  constantly during a session, so the live site reflects an edit almost at once.
- **The Apply button disappears when no form URL is set** (and none is inherited
  from the Hero tab). A dead "Apply" anchor is worse than none.
