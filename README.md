# Anirudh Tirumala — Portfolio

A full-stack personal portfolio: a Python/FastAPI backend behind a single
admin login, and a React + TypeScript + Vite + Tailwind CSS frontend. The
design is a dark "instrument panel" concept (grounded in the actual project
subject matter — computer vision and civic tech) with a signature
Three.js/React Three Fiber hero scene and pointer-tilt 3D cards throughout.

Both flagship projects get a real, working interactive dashboard on their
project page — not a screenshot, and not something that needs a backend or
database to work. Each is a faithful, from-scratch recreation of the real
product's actual UI (same navigation, same screens, same terminology),
running entirely client-side with realistic sample data, so it works the
same way for every visitor, on the live static site, with zero setup:

- **Lumpy Skin Disease Detection** — the real product's farmer / vet / admin
  dashboards, rebuilt: run a scan (upload a photo or try the built-in sample),
  see a simulated detection with bounding boxes, then follow it through a
  vet's case queue, an outbreak map, and the model registry.
- **JanSeva Connect** — the real product's citizen / staff / admin
  dashboards, rebuilt: apply to a scheme as a citizen, switch roles to staff
  or admin, and see that same application waiting in the review queue —
  approve it, then switch back to see the status update. Schemes,
  certificates, local issues, and the multilingual AI assistant all work the
  same way.

Both are clearly labeled as interactive demos with sample data — nothing
either one does touches a real herd or a real government record, and no
part of either demo calls the backend.

## Stack

| | |
|---|---|
| Backend | FastAPI, SQLAlchemy 2.0, SQLite (swap to Postgres via one env var), JWT auth |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4, TanStack Query, React Hook Form + Zod, Motion, Three.js / React Three Fiber |
| Dashboards | 100% client-side — self-contained sample data and simulated logic, no API calls, no API keys needed |

## Project structure

```
backend/
  app/
    main.py          # FastAPI app, CORS, startup seeding
    models.py         # SQLAlchemy tables
    schemas.py         # Pydantic request/response shapes
    security.py        # JWT + password hashing + login throttle
    seed_data.py        # Populates an empty DB with your resume content
    routers/            # auth, profile, skills, projects, content, lumpy, janseva
  requirements.txt
  .env.example
  Dockerfile

frontend/
  src/
    components/
      three/            # the hero's React Three Fiber scene + error boundary
      sections/          # Hero, About, Skills, Projects, Credentials
      dashboards/
        lumpy/            # the Lumpy demo: theme, mock data, shell, all screens
        janseva/           # the JanSeva demo: theme, mock data, shell, all screens
      ui/                 # Button, Badge, TiltCard, BrowserFrame, CornerFrame…
    data/fallback.ts     # bundled content so the site works with zero backend
    pages/               # Home, ProjectDetail, Login, admin/*
    api/                 # axios client + typed endpoint functions
    hooks/                # React Query hooks
  package.json
  .env.example
```

## 1. Backend setup (optional — only needed for the admin content editor)

The site is fully static-friendly: with no backend deployed at all, the
homepage and both project dashboards work from bundled sample content. Run
the backend only if you want the live `/admin` editor for your bio,
projects, skills, and credentials.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Open `.env` and set at minimum:

- `SECRET_KEY` — generate one with `python3 -c "import secrets; print(secrets.token_hex(32))"`
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — your login for `/login`. These are
  only read **once**, to create the admin account when the database is
  empty — change the password afterwards by editing the database directly
  (or wiping `portfolio.db` and restarting, which re-seeds everything).

Then run it:

```bash
uvicorn app.main:app --reload
```

The API comes up on `http://localhost:8000` (interactive docs at `/docs`),
creates `portfolio.db`, and seeds it with the content from your resume.

## 2. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL defaults to http://localhost:8000
npm run dev
```

Open `http://localhost:5173`. The homepage and both dashboards work
immediately, backend or not. If you do run the backend, sign in at `/login`
with the admin credentials you set there, then use `/admin` to edit every
section of the site — it writes straight to the database, no redeploy
needed, and the frontend prefers that live content automatically whenever
the API responds.

## 3. Deploying

**Frontend** (static build) → Vercel, Netlify, or Cloudflare Pages all work
with zero config: point them at `frontend/`, build command `npm run build`,
output directory `dist`. This alone is a complete, working portfolio. Set
`VITE_API_URL` in their environment settings only if you're also deploying
the backend below.

**Backend** (optional) → Render, Railway, or Fly.io can all build straight
from the included `Dockerfile`. Two things to set on whichever you pick:
- Environment variables from `.env.example` (`SECRET_KEY`, `ADMIN_USERNAME`,
  `ADMIN_PASSWORD`, `CORS_ORIGINS` set to your deployed frontend URL, etc.)
- A persistent disk/volume for `portfolio.db` if you're staying on SQLite —
  otherwise switch `DATABASE_URL` to a managed Postgres instance (Railway,
  Neon, and Supabase all have free tiers), which needs no code changes.

## Notes on how this was built

Earlier rounds of this project were written in an offline sandbox with no
package registry access, and the notes below were written while that was
still true. It no longer is: the current tree has been through a real
`npm install && npm run build`, `tsc -b --noEmit`, `eslint .` and a live
`uvicorn` boot, all clean, with the admin panel and both dashboards driven
end to end in a browser against the running API.

An earlier round added the 3D hero scene, the pointer-tilt cards, the
`data/fallback.ts` offline-first content layer, and rebuilt both project
dashboards from scratch as self-contained demos — `three` and
`@react-three/fiber` are new dependencies as a result, so a fresh `npm
install` is required if you are coming from a version before that.

A few older deliberate trade-offs still worth knowing about:
- The backend uses synchronous SQLAlchemy rather than async — simpler and
  plenty fast for a single-admin portfolio site; worth revisiting only if
  traffic ever gets serious.
- There's no database migration tool (Alembic) set up — fine while the
  schema is stable, worth adding before you make structural changes to
  `models.py` on a live database with content you care about.
- The login throttle is an in-memory dict, not Redis — resets on restart,
  which is an acceptable trade-off for a single-admin site.

### Security, bugfix, and floating/3D pass

No new npm/pip dependencies were added this round, so an existing
`npm install` / `pip install -r requirements.txt` covers everything below.

**A security pass on the backend** — this is the part worth reading even if
you skip the rest:
- `SECRET_KEY` and `ADMIN_PASSWORD` no longer have hardcoded fallback values
  in the source. If `ENVIRONMENT=production` is set and either is missing,
  the app now refuses to start rather than silently running with a
  publicly-known default. In development, a random value is generated per
  run and printed to the console instead. **If you deploy this with
  `ENVIRONMENT=production`, you must set both in your environment first** —
  see the updated `backend/.env.example`.
- `GET /api/janseva/requests` and `GET /api/lumpy/stats` now require an
  admin login. They were previously reachable by anyone, and the former
  returned real citizen names/villages/descriptions — this was the one
  actual data-exposure risk found in the audit.
- The JanSeva chat, the Lumpy image scanner, and service-request submission
  are now rate-limited per IP (they're public by design, so this just caps
  abuse rather than requiring a login).
- Minor hardening: the login endpoint no longer has a timing side-channel
  for username enumeration, free-text fields have sane max lengths, the
  image-scan endpoint no longer echoes raw exception text to the client, and
  the Docker container now runs as a non-root user.
- Everything else was checked and is already solid: no SQL injection surface
  (SQLAlchemy ORM throughout, no raw queries), no XSS surface (no
  `dangerouslySetInnerHTML` anywhere in the frontend), passwords are
  bcrypt-hashed, every other mutating endpoint was already correctly
  gated behind admin auth, and `.gitignore` already correctly excludes
  `.env` / the database file / uploads.

**Two bugs fixed:**
- Hero's "View the work" button linked to `#projects`, which doesn't exist
  — the section's actual id is `#work`. Fixed.
- Both dashboards' role switcher (Citizen/Staff/Admin, Farmer/Vet/Admin)
  used an invisible full-screen `position: fixed` div as a "click outside to
  close" trick. That pattern silently breaks if any ancestor element ever
  gets a CSS `transform` — common with animation libraries — since a
  transform changes what "fixed" positions relative to. I rewrote both to
  listen for outside clicks directly (a `ref` + a document click listener),
  which also adds Escape-to-close, previously missing. I could not actually
  reproduce a broken role switcher in this code through extensive testing —
  a full render test across every role × every tab in both dashboards, and a
  real headless-Chromium interaction test clicking through the actual
  dropdown — so if it's still not switching for you after this, it's likely
  something that only shows up in a real build/browser; screenshots or the
  exact steps you're taking would help track it down further.

**Floating/3D pass**, per the brief — every section now has a genuine
floating or 3D treatment rather than a static one: the interactive dashboard
mockup on each project page now tilts in 3D toward your cursor, floats with
a continuous idle motion, and casts a shadow that shifts with the tilt;
Skills and Credentials cards float with staggered timing so they don't move
in lockstep; Projects cards lift with a deepening shadow on hover; Hero
gained two small floating HUD-style readouts that extend the existing
bounding-box/confidence visual language; About and Credentials got subtle
floating background accents; Footer got a slow drifting glow and tactile
hover-lift social icons. All of it respects `prefers-reduced-motion` (I also
found and fixed a gap — `TiltCard` wasn't checking it before, so hover-tilt
now correctly disables for anyone with that OS preference set).

### Latest round of changes

No new npm/pip dependencies were added this round either.

**Project cards now show the real dashboards, not abstract art** — the
homepage project cards previously showed decorative line-art
(`ProjectPattern`, still used as a graceful fallback for any future project
without a live demo). They now render the actual `LumpyDashboard` /
`JanSevaDashboard` components live, scaled down into a little browser-chrome
frame (new `components/ui/DashboardPreview.tsx`), inert and hidden from
keyboard/screen-reader navigation, auto-sizing to the card via
`ResizeObserver`. `ProjectDetail`'s full demo now reads from a shared
`data/dashboardMeta.ts` registry instead of keeping its own separate copy.

**The résumé link now actually appears** — `resume_url` has existed on
`Profile` and in the admin editor from the start, but nothing on the public
site ever rendered it anywhere. Fixed: it's now a button in the Navbar
(desktop and the mobile menu) and in the Hero's button row, both
conditionally hidden until you set one.

**Skills now say where they were used** — added `used_in` to the `Skill`
model (a list of project titles, or a short freeform note like
"Coursework"). Each skill on the public site is now a clickable row that
expands to show this, linking to the matching project page when an entry's
text matches one of your two featured project titles exactly. Editable
per-skill from the admin Skills page (click the tag icon next to a skill's
name); the "add a skill" form also has an optional second field for it.
Seed data was filled in by cross-referencing each skill against what each
project's actual `tech_stack` lists — it's a reasonable starting point, not
gospel, so review it from the admin panel.

**Certificates can now have an uploaded photo** — added
`Certificate.image_url`, plus `POST` / `DELETE /api/certificates/{id}/image`
(validates JPEG/PNG/WEBP, stores under `/uploads/certificates/`, deletes the
previous file on replace so they don't pile up). Admin gets a small
camera-icon upload button per row, plus a remove button once one's set. On
the public site, a certificate with a photo opens it full-size in a lightbox
on click (Esc, backdrop click, or the × closes it); if it also has an
external verification `url`, that now shows as a small separate
external-link icon so neither is lost.

**Two new database columns** (`skills.used_in`, `certificates.image_url`) —
this project still has no Alembic migration chain (see above), and
`Base.metadata.create_all()` only creates tables that don't exist yet, never
columns on ones that already do. Added a small best-effort
`ensure_schema_upgrades()` in `database.py`, run once at startup right after
`create_all`, that adds each missing column via `ALTER TABLE`, with each
statement in its own try/except so an already-present column (or a
brand-new database) is a harmless no-op. **Your existing `portfolio.db`
picks up both columns automatically the next time the backend starts — no
manual SQL, no data loss, no need to delete the file.**

**A genuinely interactive element next to your name** — new
`components/ui/NameScanner.tsx` wraps the Hero name in a "detection frame":
corner brackets that drift toward the cursor, plus a confidence readout
(desktop only, `xl:` breakpoint up) that climbs the closer the pointer gets.
It's the one part of the Hero that responds to the visitor rather than
purely animating on load, extending the same bounding-box/confidence visual
language onto the one place that never had it. Respects
`prefers-reduced-motion` (renders a static resting frame, no listener
attached).

**Removed the two floating "Class · 0.9x" HUD chips and the "SYS // ONLINE /
17.0005° N · 82.2475° E" bar from the Hero** — added in the floating/3D pass
above, judged on reflection to be clutter that didn't tie into anything.
`NameScanner` replaces them with something that actually responds to you
instead of just floating on its own.

**On the Dribbble reference provided alongside this round's brief:** I
couldn't load the actual shot — it's a client-rendered page that blocks
fetching, and the specific ID isn't indexed anywhere searchable. I used
"make the product previews feel real, make more things respond to the
visitor" as the closest reasonable reading of the brief, while deliberately
keeping this site's existing color and type identity rather than pushing it
toward a generic dark-SaaS look. Send a screenshot in chat if you'd like a
tighter match.


### Correctness pass: admin saves, every control, and deployment config

The reported symptom was "logging in and changing things in the admin portal
doesn't work properly". That turned out to be three separate faults stacked on
top of each other, plus a long tail of smaller ones found by auditing every
interactive control in the app. This round has been built, typechecked,
linted and driven end to end in a real browser against a live API.

**The admin edits never reached the public site.** `PortfolioCacheSync`
observed the shared `["portfolio"]` query with `{ enabled: false }` and no
`queryFn`. React Query keeps one set of options per query and the last
observer to render wins, so that partial declaration wiped the fetcher off the
shared query. Every `invalidateQueries(["portfolio"])` after a save then died
with *"No queryFn was passed as an option"*, and the production build made
**zero** API calls at all — the live site was permanently rendering the
bundled `data/fallback.ts` content. Every observer of that key is now built
from one exported `portfolioQueryOptions`, and a `PortfolioChangeListener`
mounted at the app root applies a save even while you are still inside
`/admin`.

**A partial save blanked the rest of the profile.** `PUT /api/profile` called
`payload.model_dump()` without `exclude_unset`, against a schema whose every
field defaults to `""`. A request carrying one field overwrote name, bio,
email, phone, location and all three links with empty strings. Now
`exclude_unset=True`, so anything the client didn't send keeps its stored
value — and every other `update_*` route in every router was checked and fixed
the same way.

**A blank form could overwrite real content.** Each admin editor ran
`useQuery(...)` and then rendered regardless of whether the GET had succeeded;
on failure the form rendered *empty*, and one click of Save wrote those blanks
to the database. All five editors now refuse to render their form or list
until the data is actually there, showing a `LoadError` with a retry instead.

Everything else found and fixed:
- Failed mutations were silent in SkillsEditor and CredentialsEditor — fourteen
  separate saves and deletes that could fail with no message at all. Every
  mutation now surfaces its error, disables its button while pending, and
  keeps what you typed if the save fails.
- FastAPI 422s rendered as "Request failed with status code 422". The response
  `detail` array is now formatted as `field: message`, alongside friendly text
  for timeouts, offline, 401/403/404/429 and 5xx.
- A 401 cleared the token but left the UI believing it was signed in, so every
  button silently failed. It now signs you out and returns you to `/login`.
- A network blip during boot deleted a perfectly valid token and forced a fresh
  password entry — routine on a free-tier host that sleeps. Only a real 401
  signs you out now; anything else keeps the session and offers a retry.
- The admin had no navigation and no sign-out at all below 640px.
- Every in-page anchor, and scroll position on route change: `/#work` only
  rewrote the address bar, and opening a project from halfway down the home
  page landed you mid-article. A `ScrollManager` handles both, and leaves
  browser back/forward to restore their own position.
- The mobile menu never closed when you tapped a link and left
  `document.body` scroll-locked — the whole site appeared frozen.
- An unknown URL rendered a completely blank page; there is now a real 404.
- Admin fields the public site ignored: the "Featured" checkbox did nothing, a
  project's description never reached its home-page bullets, and clearing a
  skill's "used in" silently restored hard-coded names.
- Both project dashboards: dialogs positioned against the tilted browser-frame
  mockup instead of the viewport (the Lumpy case dialog was effectively
  unreachable), mobile drawers with off-screen close buttons, role switches
  that left header, sidebar and body disagreeing, a vet's scan filed under the
  demo farmer's account, dead buttons, and mouse-only list rows.
- Backend: `ORDER BY sort_order` had no tiebreaker, so on Postgres saving one
  item reshuffled the public list; write schemas had no `max_length`, so normal
  input passed on SQLite and 500'd on Postgres; the login throttle keyed on the
  proxy IP, which behind a shared proxy let anyone lock the owner out (now
  per-username with exponential backoff); `CORS_ORIGINS` now tolerates a
  trailing slash.

**Design.** The hero was bottom-aligned inside a `100vh` section, so the first
screen opened with roughly a third of it empty; it is centred now. The Skills
section rendered every skill's project trail expanded at all times, which made
it about four screens tall — nearly twice the Work section — and turned a list
meant to be skimmed into a wall of repeated labels; each skill is now a
disclosure showing its project count, with the names one click away, and the
section is 47% shorter. The "Demo preview" badge was printed on top of each
mock's own top-right label. There is a real social-share card at
`public/og-image.png`, drawn in the site's own instrument-panel language, with
the Open Graph and Twitter tags to go with it; sharing the link previously
produced a bare grey box. `index.html` also gained a canonical URL, a correct
`theme-color`, and a `<noscript>` fallback, and `vercel.json` now sets security
and cache headers.

### Visual pass: the instrument panel, actually built

The palette notes at the top of `index.css` describe a dark "instrument panel"
grounded in the subject matter — a vision model drawing boxes on a screen. The
page did not deliver on that. It was near-black everywhere, both accent colours
appeared only as a few small labels, there was no drawn detail anywhere, and
every section announced itself with one line of 14px text, so scrolling felt
like one undifferentiated column of dark rounded rectangles.

**The hero had a bug that made it flat.** Its background container — the WebGL
scene, the brushed-metal texture, the colour blooms, the light sweeps — was
`-z-10`. The section is `relative` with `z-index: auto`, so it never
established a stacking context, and that negatively-stacked child escaped to
the root and landed *behind* `body`, whose background is an opaque gradient
over `--color-ink-950`. Every one of those layers was painting underneath the
page. The 3D canvas had been mounting and rendering the whole time and not one
pixel of it ever reached the screen.

**The 3D scene was also rendering black on its own account.** Its forms use
`metalness: 0.95` with `envMapIntensity` set, but nothing ever assigned an
environment. In physically based rendering a fully metallic surface has no
diffuse response at all — everything you see on it is reflected environment —
so they were reflecting an empty void. Rather than add a dependency for a
preset studio, `PaletteEnvironment` builds a small environment from the site's
own palette (a cool key panel, an ice rim, a low amber fill, a floor bounce)
and pre-filters it once with PMREM. The chrome now catches the brand colours
as it turns.

**Two new shared primitives** carry the concept across the page:
`InstrumentField` draws the missing precision layer — a measurement grid, edge
calibration ticks, plotted marks with crosshairs, and a slow scan sweep — sized
in CSS pixels rather than a fixed SVG viewBox, so a tall section does not
magnify the whole graphic; and `SectionHeading` gives every section a mono
index, a rule that draws itself in, and a display-size title.

Section by section: **About** stopped interleaving icons between the sentences
of the bio (they read as punctuation errors) and now surfaces the three
capabilities that were previously hidden behind a click on a decorative card.
**Experience** became a real timeline with a rail, a lit node for the current
role and a numbered contribution log, and it still reads correctly with exactly
one entry. **Selected Work** frames each dashboard preview as a screen under
inspection, with corner marks, a calibration ruler along the seam and an
ordinal per project. **Capabilities** gives each category an icon, an ordinal
and an accent *derived from its data* — a category tints amber only when its
tools genuinely feed the civic project — and closes each card on a readout rail
of linked-project ticks. **Credentials** shows the uploaded certificate scans
as artefacts rather than hiding them behind a dotted underline. The **footer**
is now a real closing moment with the email as an unmissable primary action,
and the **navbar** gained a drawn reticle lockup and a caliper that measures
off whichever section you are reading.

Throughout, the colour rule is meaning rather than decoration: pale blue marks
the computer-vision work, amber marks the civic work. Everything respects
`prefers-reduced-motion` (verified: zero running animations under the
`data-motion="reduced"` kill-switch), and the whole graphic layer steps back at
phone width, where five grid squares across would read as graph paper.

### One 3D world behind the whole page

The previous pass got the hero's WebGL scene rendering for the first time. It
was still only the hero: depth stopped the moment you scrolled, and every
section below it was flat. There is now a single persistent world instead —
`components/three/SceneBackdrop.tsx`, mounted as one fixed canvas in
`SiteLayout` with all page content above it, which the entire document scrolls
over.

The camera dollies forward through a layered field as you scroll, so the page
reads as a move through one space rather than a stack of cards. What is in
that space: four depth layers of wireframe detection boxes (the bounding-box
motif, in 3D), chrome plates catching the environment, a drifting mote field,
and the icosahedron-and-rings core the hero is composed around. Near layers
move most, which is what produces the parallax.

Three details are worth knowing about:

- **The fog crosses from pale blue to amber on the way down.** That is the
  site's own colour rule made spatial — scope marks the computer-vision work,
  signal marks the civic work — so the world itself travels between them
  rather than the accent only being applied per card.
- **Bloom without a postprocessing pass.** An effect composer is a dependency
  this project does not carry, so the glow is billboarded planes with a radial
  falloff painted into a canvas texture and blended additively. One
  transparent quad per halo, and the chrome reads as genuinely luminous.
- **Every box layer is one draw call.** Drawn individually they would be a
  call each, and the field needs enough of them to read as a volume, so each
  layer's transforms are baked into a single merged buffer and the layer
  drifts as a group.

Cost and restraint: the whole thing is one WebGL context, lazily loaded as its
own chunk so it is not in the first download, gated behind
`(min-width: 768px) and (hover: hover)` — a phone gets **no canvas at all** and
is carried by the CSS instrument graphics — and switched off entirely under
`prefers-reduced-motion`. The scroll value is kept outside React, because
routing it through state would re-render the tree sixty times a second for a
number nothing in the DOM renders.

On top of the world, the section cards gained real layered depth: contents at
different `translateZ` values inside a shared perspective, so tilting a card
makes its parts move against each other. The project dashboard previews are
the clearest case — the screen sits forward of the text column with its corner
marks forward again, catching a lit edge along the top as it turns.

Verified: `tsc` and `eslint` clean, production build clean, one canvas on
desktop and zero on mobile, no horizontal scroll at 375px, no dead anchors, no
unlabelled buttons, and zero running animations under the reduced-motion
kill-switch.

### Résumé upload, a CORS fix, a bending grid, and a performance pass

**The intermittent `400 Bad Request` on CORS preflights.** `CORS_ORIGINS` pins
one port, but a local frontend does not reliably get it — Vite moves to 5174
when 5173 is busy, and `vite preview` serves on 4173. Each of those is a
different origin, so the preflight was rejected with a bare 400 and no
explanation on either side. In development the API now also accepts any
loopback origin via a regex; production still matches the exact list, and a
genuinely foreign origin is still refused. Separately, the revision poll no
longer sends a `Cache-Control` request header: that header alone made every
poll a non-simple request, so each one cost a preflight round trip as well.
The server already answers `Cache-Control: no-store`, which is what actually
matters.

**A résumé can now be uploaded, not just linked.** `POST`/`DELETE
/api/profile/resume` accept a PDF, verified by its magic bytes rather than the
browser's `content_type`, stored under `/uploads/resume/`, with the previous
file removed on replace. `resume_url` holds either an upload or an external
link, and the public Resume buttons in the navbar, hero and footer resolve
both. The admin gets an upload/replace/remove control beside the existing URL
field, and a View link to open what is currently set.

**The grid bends around the cursor.** It used to be two CSS repeating
gradients: perfectly straight and completely inert. `BendingGrid` draws it to a
canvas instead and displaces each vertex away from the pointer with a squared
falloff, so the lines swell locally like a lens and relax when the pointer
leaves. One shared `pointermove` listener serves every grid on the page, each
grid only runs a frame loop while it is on screen, and the loop stops once the
bulge has settled — an idle page does no work.

**Performance.** The lag was mostly the new 3D world, so: render scale capped
lower, six lights cut to three (each one multiplies the cost of every metal
surface, and the environment map was already doing the lighting), fewer chrome
plates and motes, and `.glass-panel`'s backdrop blur reduced — `backdrop-filter`
is cheap over a static page and expensive over one with a scene animating
behind it. The `drift` keyframe lost its `scale`, which was forcing a 130px
blur to re-rasterise every frame instead of letting the compositor move a layer
it already had.

Because none of that can be tuned for hardware that cannot be measured in
advance, the scene now measures itself: `AdaptiveQuality` watches the real
frame rate and, after three consecutive slow seconds, steps the render scale
down — and if even the lowest step cannot hold a reasonable rate, unmounts the
scene entirely and lets the CSS instrument graphics carry the page. Steps are
one-way, because quality that oscillates around a threshold is worse than
quality that is simply lower.

**More things tilt.** The Skills category cards, the Experience contribution
log, the education card and the certificate plates are all `TiltCard`s now.
Strength is tuned per surface: a certificate is a physical artefact and gets
the strongest tilt, while the Skills cards — where every row is a button — get
a gentle one, so the panel feels like an object you can push without the thing
you are aiming at sliding out from under the pointer.

### Every box tilts

The pointer-tilt treatment now covers every card on the page rather than the
project tiles alone, all at the projects' own `strength={6}` so one surface
behaves like the next: the footer's email plate and its GitHub / LinkedIn /
phone / resume channel tiles, the language chips, the three About capability
tiles, the Skills category cards, the Experience contribution log, the
education card, the certificate plates, and the orbit card beside the name in
the hero.

Two details that matter for how they were wrapped:

- **Where a whole card is one link**, the tilt goes *inside* the anchor rather
  than around it. The anchor stays the untransformed hit area and the surface
  inside it turns, so the click target never moves out from under the pointer
  on its way down. The hover states moved from `hover:` to `group-hover:` for
  the same reason - the group is the anchor, which is what the pointer is
  actually over.
- **Strength is per surface.** Certificates get the strongest tilt because they
  are physical artefacts; the Skills cards get a gentle 3.5 because every row
  inside one is a disclosure button, where the furthest row moves about two
  pixels. `TiltCard` already disables rotation entirely under
  `prefers-reduced-motion`.

Verified at 1440px and 375px: 27 tilting surfaces, none overflowing, no
horizontal scroll, every wrapper correctly sized, and zero running animations
under the reduced-motion kill-switch.

### Fixing the scroll stutter

Scrolling top to bottom stuttered. The cause was structural and self-inflicted:
the previous round put a WebGL scene behind the whole page, and then left 39
`backdrop-filter` surfaces sitting on top of it. A blurred backdrop is cheap
over a static page and ruinous over a moving one — the browser re-blurs
everything behind the element on every frame the backdrop changes, so those 39
surfaces, covering 3.7 megapixels, were re-blurring sixty times a second
whether or not anything was happening.

Measured on the built page, before and after:

| | before | after |
|---|---|---|
| `backdrop-filter` surfaces | 39 (3.7 MP) | **0** |
| blur layers | 43 (4.0 MP) | 29 (1.2 MP) |
| blurs ≥ 60px radius | 20 | 6 |
| permanent `will-change` layers | 27 | **0** |
| canvases | 8 (11.8 MP) | 2 |

What changed:

- **No backdrop blur anywhere in the portfolio shell.** The classes are gone
  from the markup rather than overridden in CSS, so the code says what it does.
  The cards' own tint went from 40% to 75% to compensate, which leaves 16% of
  the scene showing through a card instead of 37%; the world still reads in the
  gaps between cards, which is where it was doing the work anyway. The
  dashboards keep their blur — nothing animates behind those.
- **One grid canvas instead of seven.** `BendingGrid` was mounted per section
  and sized to the whole section, which meant nearly twelve megapixels of
  compositor layer for a graphic that is only ever a screenful at a time. It is
  now a single viewport-fixed canvas offset by the scroll position, and it no
  longer needs a per-section rect read or visibility observer.
- **Gradient blooms instead of blur filters.** Fourteen decorative discs used
  `filter: blur(120px)` and up, each forcing a rasterise and a very wide
  convolution. A `radial-gradient` gives the same soft disc for a paint and
  nothing else.
- **`will-change` is transient.** `TiltCard` held `will-change: transform`
  permanently on 27 cards — a permanent compositor layer each, for a transform
  that only happens under the pointer. The hint is now raised on enter and
  dropped on leave.
- **No forced reflow on scroll.** `useScrollProgress` read
  `document.documentElement.scrollHeight` inside the scroll handler, forcing a
  layout on every scroll event. It is cached and refreshed by a ResizeObserver
  on the body instead.

A caveat on how this was verified: the browser available here runs its page in
a hidden pane, which throttles `requestAnimationFrame`, so frame rate could not
be sampled directly. What is measured above is the work per frame — layer
count, blurred area, canvas pixels, forced layout — which is what was driving
the stutter. The `AdaptiveQuality` backstop added in the previous round still
applies on top: the scene watches its own frame rate on real hardware and steps
render scale down, or bows out entirely, if it cannot hold one.
