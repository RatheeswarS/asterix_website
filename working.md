# How Recruitment Works

Everything the 2026-27 crew selection does, end to end: which route runs, what
it checks, where the data lands, and which piece decides an answer when two
pieces disagree.

Written for whoever runs the next cycle. It documents the system as it is, not
as it was planned — where the two differ, the code is the truth and this file
follows it.

Last verified: 2026-09-01 · cycle `2026-27`

---

## 0. The one rule

**The server clock decides everything.** The countdown, the "Open now" chips and
the enabled submit button are presentation. `windowOpen()` in
`server/src/routes/recruitment.js` is the thing that accepts or refuses, and it
reads `Date.now()` on the server.

A candidate who sets their laptop clock back gains nothing. Someone posting
straight to the API with `curl` gains nothing. The portal now measures the gap
between the visitor's clock and the server's on every config fetch
(`serverTime`, halved round trip) and renders against the server's, so the page
and the API agree about what is open — but only the API's answer counts.

---

## 1. Three tracks, three different processes

Defined once in `server/src/lib/recruitmentConstants.js` and enforced from
there. A track's *shape* is code; a track's *dates and text* are data the admin
edits.

| | Software & Perception | Powertrain | Mechanical |
|---|---|---|---|
| Ref prefix | `ASX-SW-` | `ASX-PT-` | `ASX-ME-` |
| Team based | Yes | Yes | No — individual |
| Written test | No | **Yes**, in person | No |
| Team draw | Right after applications close | Only from those who cleared the test | Never |
| Submission phases | `sw-phase-1`, `sw-phase-2` | `pt-solution` | `me-solution` |
| Brief unlocks at | `TEAM_ASSIGNED` | `TEST_PASSED` | `APPLIED` |

Phase ids are namespaced per track on purpose. `PHASE_TRACK` maps each back to
its owner, and `/submit` rejects a phase that does not belong to the applicant's
track — so a mechanical applicant cannot file work against the powertrain
problem statement even by hand-crafting the request.

### Applicant lifecycle

`STAGES` is one enum across all tracks; `TRACK_STAGES` says which values each
track can legitimately reach, and the admin PATCH refuses anything outside it.

```
                    ┌─ TEST_ABSENT ─┐
APPLIED ──(test)────┼─ TEST_FAILED ─┼──► (out)
                    └─ TEST_PASSED ─┘
   │                       │
   └───────(draw)──────────┴──► TEAM_ASSIGNED
                                    │
                    ┌───────────────┴───────────────┐
        PHASE_1_SUBMITTED → PHASE_2_SUBMITTED   SOLUTION_SUBMITTED
                    └───────────────┬───────────────┘
                                    ▼
                              INTERVIEW ──► CONCLUDED
```

`STAGE_RANK` gives the ordering used for "has this applicant reached at least
X", which is how brief gating is decided. Terminal states rank high, so someone
who has concluded never loses access to material they already had.

---

## 2. The candidate's path

### 2.1 Apply

`POST /api/recruitment/apply` — rate limited, 40 per IP per 10 minutes.

The limit is deliberately loose: a campus sits behind one NAT, so a whole cohort
applying from college wifi shares a single address. Duplicate applications are
prevented by a unique index on `{email, cycle}`, not by the rate limit.

Checks, in order:

1. `track` is a real track.
2. `name` and `email` are present, and the email parses.
3. The track is enabled this cycle.
4. `windowOpen(applyOpensAt, applyClosesAt)` — **server clock**.
5. No existing application for that email in this cycle.

On success the server allocates a reference code (`ASX-<PREFIX>-<4 digits>`,
retried past collisions) and a 24-byte random token. **Only the bcrypt hash of
the token is stored.** The plaintext is returned once and never again.

> The apply screen makes the candidate tick "I have saved these" before it will
> move on. That is not decoration — the token genuinely cannot be recovered or
> re-sent, and a candidate who loses it has to be looked up by hand.

### 2.2 Check status

`POST /api/recruitment/lookup` with `{refCode, token}` — 120 per IP per 10 min.

`resolveApplicant()` always runs a bcrypt comparison, against a dummy hash when
the reference code matched nothing, so response timing does not reveal which
reference codes exist.

The response (`applicantView`) carries: the applicant's own stage and status,
their team and its submissions if drawn, their own submissions, the stage
running now, the next stage, whichever submission phase is open to them, and —
only if entitled — the full problem statement.

The browser keeps the credential in `localStorage` purely so a returning
candidate does not retype it. The server re-verifies both values on every
request, so a tampered local copy buys nothing.

### 2.3 Submit work

`POST /api/recruitment/submit` — 60 per IP per 10 min.

1. Credential resolves to an application.
2. Application status is `ACTIVE`.
3. `PHASE_TRACK[phase]` equals the applicant's track.
4. `url` is a working `http(s)` link.
5. The phase corresponds to a stage in the current schedule.
6. `windowOpen(stage.opensAt, stage.closesAt)` — **server clock**.
7. On a team track: the applicant has been drawn into a team.

Submissions are **links, not uploads**. The upload path takes images only and
its disk does not survive a restart, so a Drive or GitHub URL is both simpler
and more durable than a file the host might lose.

Submitting again **appends**; it never replaces. The latest entry is the one
reviewed, and an accidental resubmission cannot destroy earlier work. On a team
track the entry lands on the team, and every member's stage advances with it.

---

## 3. The admin's path

All of `/api/recruitment/*` admin routes require a valid JWT
(`authenticateToken`). The console lives at `#admin` → **Recruitment Portal**.

### 3.1 Schedule tab

Edits the singleton `RecruitmentConfig` document via `PUT /api/recruitment/config`.

Per track: name, card blurb, whether it recruits this cycle, the application
window, and the full stage list — label, one-line detail, opens/closes in IST,
plus reorder, add and delete.

- Timestamps are stored as ISO strings carrying an explicit `+05:30`, so no
  consumer has to guess a zone. `src/lib/istTime.js` converts both directions;
  `datetime-local` inputs speak the editor's local time and must never be
  read as IST directly.
- `submissionPhase` is **read-only** in the UI. The server matches submissions
  against those ids, so a typo would silently orphan real work. Deleting a stage
  that carries one asks for confirmation and warns that the phase stops being
  submittable.
- The PUT merges per track, so a partial payload cannot blank a brief nobody was
  editing.

**Why the schedule is its own collection and not part of `SiteData`:** the
server reads it to decide whether a window is open, and `SiteData` is a
client-writable blob replaced wholesale on every content save. A deadline that a
general content save could overwrite is not a deadline.

### 3.2 Briefs tab

Title, public description, deliverables, the problem statement body, an optional
attachment, and the **gated** flag.

Gated means the body and the file URL are stripped from `/config` entirely — not
hidden by the page, *absent from the response*. An entitled applicant receives
theirs through `/lookup`. That is what stops a mechanical applicant reading the
powertrain statement before the people who actually sat the written test do.

### 3.3 Applications tab

Filter by track, stage, status or free text; change stage and status inline;
export CSV. Stage changes are validated against `TRACK_STAGES` for that
applicant's track.

**Powertrain written test:** paste the reference codes of everyone who cleared
it into the bulk box. `POST /applications/bulk-advance` is scoped to the track,
so a stray code from another track is reported as unmatched rather than
advanced. It sets `writtenTest.attended`, `writtenTest.passed` and the stage
together.

### 3.4 Teams tab

`POST /teams/draw`. Seeded and reproducible: the seed and a roster hash are
stored on every team, so a draw can be replayed and shown to have been fair.

- Software & Perception draws from everyone who applied.
- Powertrain draws only from those marked as having cleared the written test.
- The two pools are never combined, and the route refuses a draw on a track that
  does not use teams.
- Re-drawing over an existing set returns `409 requiresConfirmation` first. The
  old teams are cleared only *after* the new draw computes successfully, so a
  failed draw never leaves a track team-less.

### 3.5 Results tab

`POST /config/publish-results` per track. Nothing reaches a visitor until it is
published: `publicTrack()` returns an empty `resultsBody` for an unpublished
track, so the embargo holds against someone reading the API directly, not just
against the page.

---

## 4. What the public sees

`GET /api/recruitment/config` is the only recruitment endpoint the portal calls
without a credential. `publicTrack()` decides what leaves the building:

| Field | Public? |
|---|---|
| Track name, blurb, team/test shape | Yes |
| Application window, `applyOpen` | Yes |
| Stage list with opens/closes | Yes |
| Brief title, description, deliverables | Yes |
| Brief body, attachment | **Only if ungated** |
| `resultsBody` | **Only once published** |
| Disabled tracks | Omitted entirely |

The portal re-reads this on a 60-second poll and whenever the tab regains focus.
Before that it read once at mount, so a deadline moved by an admin stayed wrong
on every tab already open.

---

## 5. Running a cycle

1. **Before opening.** Set the `notice` banner on the Schedule tab so someone
   landing early finds an explanation rather than three closed forms. Set every
   track's application window and stage windows. Write the briefs and confirm
   each one's `gated` flag and unlock stage.
2. **Open.** Clear the `notice`. Watch the Applications tab; the count is live.
3. **Powertrain test day.** Run it offline. Paste the cleared reference codes
   into the bulk box. Anyone not listed stays at `APPLIED` — mark absentees
   `TEST_ABSENT` individually if you want the record straight.
4. **Draw teams.** Software as soon as applications close; Powertrain after the
   test results are in. Record the seed shown — it is what lets you prove the
   draw later.
5. **Submission windows.** Nothing to do; the server enforces them. Watch the
   Subs column.
6. **Interviews.** Move applicants to `INTERVIEW`, then `CONCLUDED`. Use
   **Select** on the row for anyone taken on.
7. **Publish results.** Write each track's result body, publish, and confirm on
   the public page that it appears.
8. **After.** Export the CSV for the record, then add the intake to the roster on
   the Subsystems tab. New members get an engineering credential from there.

---

## 6. Verified pipelines

Checked on 2026-09-01 with `npm run lint`, `npm run build`, and a live boot of
the API.

| Pipeline | Route(s) | State |
|---|---|---|
| Public schedule | `GET /api/recruitment/config` | ✅ 200, seeds defaults when the DB is empty |
| Apply | `POST /apply` | ✅ window + duplicate + validation guards in place |
| Status lookup | `POST /lookup` | ✅ constant-time credential check |
| Submit work | `POST /submit` | ✅ cross-track, window and team guards |
| Admin config read/write | `GET /config/admin`, `PUT /config` | ✅ per-track merge |
| Applications list/patch | `GET`, `PATCH /applications` | ✅ stage validated per track |
| Written-test bulk advance | `POST /applications/bulk-advance` | ✅ track-scoped, reports unmatched |
| Team draw | `POST /teams/draw`, `GET /teams` | ✅ seeded, confirm-before-redraw |
| Publish results | `POST /config/publish-results` | ✅ embargo enforced server-side |
| CSV export | `GET /export` | ✅ auth required, so it cannot be a plain link |
| Site content | `GET/PUT /api/site-data` | ✅ admin JWT required to write |
| Image upload | `POST /api/upload` | ⚠️ see below |
| Health | `GET /api/health` | ✅ reports real DB and upload state |

### The one that needs an environment, not a code change

**Image uploads.** `POST /api/upload` refuses outright unless either ImageKit is
configured or a persistent volume is mounted at `UPLOADS_DIR`. That refusal is
correct and deliberate: on a plain container the disk is wiped by every deploy,
and writing there produces URLs that work once and 404 forever after — which is
how the gallery and squad photos were lost once already.

When the CDN is unavailable the admin falls back to a compressed inline copy and
says so on screen, in those words, rather than letting a 15 KB placeholder pass
for a real upload.

To fix it properly, set on the API host:

```
IMAGEKIT_PUBLIC_KEY=...
IMAGEKIT_PRIVATE_KEY=...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/<your-id>
```

`GET /api/upload/status` reports which of these is live without exposing a
secret.

### Required environment

| Variable | Needed for | Without it |
|---|---|---|
| `MONGODB_URI` | Everything persistent | Recruitment serves seed defaults; credentials and site data return 503 |
| `JWT_SECRET` | Admin login | Falls back to a development key and warns loudly. **Set this before exposing the admin.** |
| `IMAGEKIT_*` | Durable image uploads | Uploads refused; admin falls back to inline copies |
| `CORS_ORIGIN` | Browser access from the site | Defaults to localhost + the known Vercel origins |
| `VITE_API_URL` | Frontend → API (build time) | Production falls back to the known Render URL |

---

## 7. Engineering badges

Not recruitment, but the other end of the same thread: what a member takes with
them when they leave.

It is deliberately small. A **downloadable PNG**, drawn in the member's own
browser, and nothing else — no hosted page, no route, no API, no identifier to
look up. There was a version with all of that, and it bought a verification
story nobody had asked for at the cost of four files and an endpoint; what a
member actually wants is an image they can put in a post or a CV.

- **Where.** Each member card on a subsystem page carries **Download badge**.
- **How.** `src/lib/badgeImage.js` draws to a canvas and saves a PNG. 900×480,
  multiplied by the device pixel ratio so it stays crisp in a slide or a PDF.
- **What it says.** Portrait, name, role, subsystem, the specialist tag, and an
  ALUMNI or ACTIVE CREW chip — everything already on the roster. No separate
  record to fill in, so a badge is never out of date with the site.
- **Styling.** The site's own language: white card, hard black border, offset
  shadow, subsystem colour strip. `SUBSYSTEM_COLORS` maps the Tailwind class to
  a hex value, because canvas cannot read a class name.
- **Cropping.** `drawFramed` reimplements `object-fit` / `object-position` as
  canvas source-rectangle maths, so the badge crops a photo exactly the way the
  website does. Without it, a portrait whose focal point was deliberately moved
  in the admin would be centre-cropped here.

Two failure modes are handled explicitly rather than left to the console:

- **A photo that will not load** falls back to an initials block. A badge
  without a photograph is still a usable badge.
- **A photo served without permissive CORS headers taints the canvas**, and the
  error surfaces only at `toBlob`, after everything has been drawn. The button
  reports it in words and says to re-upload through the admin so the file lands
  on the CDN. `crossOrigin` is set before `src`, which is the only order that
  works.

Webfonts are awaited via `document.fonts.ready` before drawing. A canvas drawn
first silently falls back to the system stack — the exact bug the site's font
tokens exist to prevent.

---

## 8. Things that look wrong but are not

- **Rate limits are loose.** A campus is one IP. The unique index on
  `{email, cycle}` is what actually stops duplicates.
- **A missing ref code and a wrong token give the same error.** Distinguishing
  them turns the endpoint into a way to enumerate reference codes.
- **`currentStage()` prefers a stage that accepts a submission** when two windows
  overlap. Overlapping windows are easy to set by accident, and unavoidable for
  the instant one stage closes as the next opens. Taking the first match would
  tell a candidate there was nothing to submit while the window was open.
- **The countdown keeps ticking after the last deadline**, slowly. Tearing the
  interval down froze the clock at mount, and a tab left open across a boundary
  went on showing a closed stage as live.
- **Site content polls every 3.5 s; the recruitment schedule every 60 s.** The
  first is a small blob the admin edits constantly during a session. The second
  changes a handful of times per cycle.
