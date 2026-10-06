---
name: vbs-design
description: Design system and content rules for the VBS Closets & Cabinets website (vbscabinets.ca). Use whenever building, restyling, reviewing or writing copy for any page, section or component in this repo — including choosing images, pulling in 21st.dev components, adding animation, adding dependencies, or editing site text.
---

# VBS Closets & Cabinets — design rules

VBS is a local custom cabinetry and millwork business based in Hamilton, Ontario. The site has one job: **turn a homeowner looking at real VBS work into a quote request.** Every decision should build trust (this is real, local, skilled work) and make "Request a Quote" easy at every moment.

## Aesthetic

**Premium residential cabinetry and custom millwork.** Warm, architectural, trustworthy — like a cabinetmaker's portfolio or an architect's project book.

- Large real photography carries the page; UI stays quiet around it.
- Generous whitespace and a strong, obvious hierarchy: one clear message and one clear action per section.
- Materials feel tactile: warm off-white, charcoal, natural wood tones, one restrained red.

**It must not look like:** a SaaS or tech-startup landing page, a renovation-franchise ad, or generic AI-generated UI.

Explicitly avoid:
- Glassmorphism, frosted panels, backdrop-blur cards
- Neon or rainbow gradients, gradient text, gradient buttons, glowing shadows
- Floating blobs, mesh/aurora backgrounds, grain-noise hero gradients, decorative 3D shapes
- Excessively rounded cards (`rounded-2xl`+), pill-shaped everything, bento grids of icon cards
- Emoji or generic icon-in-a-circle feature grids, "✨" sparkles, stock-illustration people
- Dark-mode-first tech palettes, metric counters ("500+ happy clients") without real data

## Stack

- Intended architecture: Astro (static output) + Tailwind CSS + React islands, deployed to Cloudflare Pages from `dist/`.
- `package.json` is the source of truth for versions — read it before relying on version-specific APIs or docs. At the time of writing: `astro` ^7.3.6, `tailwindcss` / `@tailwindcss/vite` ^4.3.3 (CSS-first config via `@theme`, no `tailwind.config.js`), `@astrojs/react` ^7.0.1, `react` / `react-dom` ^19.3.0. Node ≥ 22.12.
- Use `.astro` components by default. Use React (`.tsx`) **only** for components that need client-side interactivity (mobile menu, gallery/lightbox, before/after slider, quote form), hydrated with the laziest directive that works (`client:visible` > `client:idle` > `client:load`).
- Path alias `@/*` → `src/*`.
- The original site is preserved in `legacy/` as the reference for brand and content. Never edit it.

### Dependencies

**Do not install any new dependency without first explaining to the user what it is, why it's needed, what it costs (bundle size / JS shipped) and what the no-dependency alternative would be — then wait for approval.** This includes fonts, icon sets, animation libraries, UI kits and anything a 21st.dev component pulls in. Prefer CSS and small hand-written code over packages.

## Colour

Tokens live in `src/styles/global.css` under `@theme`. Always use token utilities (`bg-paper`, `text-ink`, `border-line`…). Never hard-code hex values in components, and never use Tailwind's default palette (`gray-*`, `zinc-*`, `red-*`, `slate-*`…).

| Token | Hex | Role |
|---|---|---|
| `paper` | `#f7f4ef` | **Primary/default page background** — warm off-white |
| `card` | `#fbfaf8` | Raised surfaces, form fields on paper |
| white | `#ffffff` | Selective contrast surfaces only (photo mats, cards or a single band on paper) — never the default page background |
| `ink` | `#171717` | Dark charcoal — headings, body text, dark bands, footer |
| `muted` | `#625b54` | Secondary text |
| `line` | `#e4ddd3` | Borders and dividers |
| `line-strong` | `#8a7f73` | Form control borders (inputs, selects) — meets 3:1 non-text contrast |
| `warm` | `#9c7a58` | Natural wood tone — rules, bullets, small decorative accents |
| `warm-dark` | `#7d5f40` | Darker wood tone for small text (eyebrows) — meets AA on paper and white |
| `accent` | `#c9242a` | VBS red (from the logo) — primary CTA only |
| `accent-dark` | `#a71b20` | Hover/active state of accent |

Rules:
- **Red is restrained.** Use it for the Request a Quote action and tiny highlights (step numbers, an active nav underline). Never red headings, red section backgrounds or large red areas. At most one red button per viewport.
- Wood tones come primarily from the photography; `warm` echoes them in small UI details. If a lighter oak tint is needed (e.g. a subtle section band), propose adding a token rather than inventing a hex inline.
- Use `bg-ink` for at most one or two bold bands per page (quote CTA, footer).
- Text contrast must meet WCAG AA. `warm` is for decoration only (it fails AA as small text); use `warm-dark` for eyebrows and small labels.

## Typography

- **Headings:** a refined serif/display face — preferred choice **Fraunces** — weight 400–600, slightly tight tracking at large sizes. Never heavy black serif, never all-caps serif headlines.
- **Body and UI:** a clean sans-serif — preferred choice **Inter** — weight 400–600.
- **Neither font is installed yet. Do not install Fraunces, Inter or any font package until the user approves the dependency** (see Dependencies). Until then, use a system serif / system sans fallback stack.
- Two families maximum. Once approved, fonts must be self-hosted and actually loaded (the legacy site named Inter but never loaded it).
- Use this scale consistently; don't invent one-off sizes:

| Role | Size | Line height |
|---|---|---|
| Display / h1 | `clamp(2.5rem, 5.5vw, 4.5rem)` | 1.05 |
| h2 | `clamp(2rem, 4vw, 2.75rem)` | 1.1 |
| h3 | 1.5rem (24px) | 1.2 |
| h4 / card title | 1.25rem (20px) | 1.25 |
| Lead | 1.125rem (18px) | 1.6 |
| Body | 1rem (16px) | 1.6 |
| Small | 0.875rem (14px) | 1.5 |
| Eyebrow | 0.75rem (12px), uppercase, `tracking-[0.18em]`, extra-bold, `text-warm-dark` | 1.4 |

- Paragraphs max ~65ch. One `h1` per page.

## Spacing — 8px system

All spacing, sizing and gaps use multiples of 8px (4px allowed only for fine adjustments inside small components, such as icon gaps or badge padding). Tailwind's default spacing unit is 4px, so use even steps: `2` (8px), `4` (16px), `6` (24px), `8` (32px), `10` (40px), `12` (48px), `16` (64px), `20` (80px), `24` (96px), `32` (128px). Avoid odd steps (`3`, `5`, `7`) and arbitrary values like `p-[13px]`.

- Page container: max width 1180px, horizontal padding 24px (16px under 640px).
- Section padding: 96–128px desktop, 64px mobile.
- Gap between section heading block and content: 48px.
- Card/grid gaps: 16–24px. Component internal padding: 24–32px.

## Shape & elevation

- Corners: small and crafted — 2–6px (`rounded-sm`, `rounded`, `rounded-md`). Pills only for small tags like service-area chips.
- Prefer 1px `border-line` and whitespace over shadows. One soft shadow style (`0 16px 48px rgb(20 18 15 / .10)`) reserved for hero media or a featured frame.

## Imagery

**Real VBS project photos are the main visual focus.** Lead every page and section with them, large, with deliberate cropping (`object-cover` + chosen `object-position`).

Truth rules (non-negotiable):
1. Only real VBS photographs may be presented, captioned or implied as VBS work.
2. Any rendered or AI-generated image must be **clearly labelled as a design concept** on the image itself (visible caption/badge, e.g. "Design concept"), never mixed into the project gallery, and never placed next to "real project" claims.
3. These files appear to be rendered/AI-generated marketing graphics: `service-tv-walls-built-ins`, `service-fireplace-built-ins`, `service-floating-shelves`, `service-media-walls`, `service-garage-shelving`, `process-before-after`. Treat them as design concepts (rule 2) or leave them out. Prefer leaving them out where a real photo can do the job.
4. `light-fluted-feature-wall*` shows an unfinished install (bare MDF, painter's tape) — do not use.
5. Never generate, stock-source or AI-render new imagery to stand in for VBS work. If a section lacks a real photo, use a typographic treatment and flag the gap to the user.
6. Don't show the same photo twice on one page.

Real photos available: black media wall (`hero-black-media-wall`, `black-media-wall-wide`, `black-media-wall-detail`), arched fireplace built-in (+ `-alt`), two-tone kitchen (+ `-alt`), `sliding-panel-doors`, `herringbone-wood-gate`, `custom-oak-dresser`, `oak-nightstands`, `custom-woodwork-detail`.

Technical:
- Images used in components go in `src/assets/images/` and render via `astro:assets` `<Picture>` (AVIF + WebP, responsive `widths`, explicit `sizes`). Keep originals in `public/assets/images/` until the legacy site is retired.
- The hero/LCP image loads eagerly with `fetchpriority="high"`; everything else lazy. Dimensions always set — no layout shift.
- Alt text describes the build (materials, finish, features). Never "image of", "photo" or "promotional graphic".

## Services — priority order

Lead with, and give the most space to:
1. **Custom cabinetry** (incl. kitchens)
2. **Closets** (walk-in and reach-in)
3. **Media walls** (TV walls, fluted panels, fireplace surrounds)
4. **Built-ins** (fireplace built-ins, benches, storage walls)
5. **Custom woodworking** (furniture, dressers, nightstands, gates, one-off pieces)

Secondary (present, but lower in hierarchy): floating shelves, garage shelving, sliding panel doors.

## Conversion — Request a Quote

- "Request a Quote" is the single primary action site-wide. It appears in the header, in the hero, after the project showcase, and as a dedicated quote section near the end of every page.
- Consistent label everywhere: **"Request a Quote"** (hero may use "Request a Free Quote").
- Supporting actions (call, WhatsApp, email, Instagram) are secondary styling — outline or text links — never competing red buttons.
- The quote path asks for what VBS actually needs: city, project type, rough dimensions, photos of the space, inspiration images.

## Navigation & mobile

- **Mobile first.** Design at 360px first, then scale up. Test 360, 768, 1024, 1280px.
- Every width has working navigation. Below desktop, a menu button opens an accessible drawer/sheet containing all nav links plus the quote CTA and phone number.
- **Persistent contact/quote access on mobile:** a sticky bottom bar (Call · Request a Quote) or a sticky header with the quote button. It must not cover content or the iOS home indicator (use `env(safe-area-inset-bottom)`).
- Desktop header is sticky, compact, logo left, links centre/right, Request a Quote button right.

## 21st.dev components

- Use selectively — only for interactive building blocks where it saves real work: mobile drawer, lightbox/gallery, before/after slider, form fields, accordion/FAQ.
- **Fully restyle** every component to this skill: VBS tokens, type scale, 8px spacing, small radii. Strip default shadcn/zinc colours, dark-mode variants, gradients, glass effects, glows and decorative animation. Remove unused props and code.
- Reject components that need heavy dependencies for decorative effect, or that conflict with the "avoid" list above.
- Any dependency a component requires falls under the dependency rule: explain and get approval first.

## Motion

- Use motion only when it improves understanding or feel: opening/closing the menu and lightbox, a before/after drag, a subtle fade/rise as sections enter (≤ 16px, 300–500ms, ease-out), gentle image zoom on hover (≤ 1.03).
- Default to CSS transitions. The `motion` library is not installed; add it only when a specific interactive island genuinely needs it (and explain first).
- No decorative animation: no parallax, scroll-jacking, auto-playing carousels, marquee logos, typewriter/text-scramble effects, bouncing or pulsing CTAs, cursor effects.
- Always honour `prefers-reduced-motion: reduce`.

## Accessibility (required)

- WCAG 2.2 AA. Semantic landmarks, skip link, one `h1`, logical heading order.
- Visible `focus-visible` styles on everything interactive.
- Menu drawer and lightbox: focus trapped, Esc closes, focus restored on close, background scroll locked.
- Tap targets ≥ 44×44px. Form fields have real `<label>`s, clear required markers and specific inline errors.
- Don't convey meaning by colour alone.

## Performance (required)

- Zero JS on pages without islands; keep each island small.
- Mobile Lighthouse ≥ 95 for Performance, Accessibility, Best Practices and SEO.
- LCP < 2.5s, CLS < 0.1 on a mid-range phone. No render-blocking third-party scripts or fonts.

## Brand & content preservation

- Keep the existing VBS identity: the VBS logo (house/wood-grain mark with red), the charcoal/off-white/red/wood palette, and the plain, practical voice.
- Keep real content from `legacy/index.html`: services, process steps, contact details, business name, and the company operator line. Rewrite for clarity, don't invent.
- **Never ship internal notes or design commentary as visible text** (the legacy site leaked lines like "no unfinished fluted wall on the homepage"). Every visible string is written for a customer.
- Don't invent reviews, ratings, years in business, project counts, warranties, licences or certifications. Leave a clearly marked TODO and tell the user.

Voice: plain, confident, local, practical. Short sentences, Canadian spelling ("centre", "colour"). No hype, no exclamation marks, no fake urgency.

Business facts (single source of truth — keep identical everywhere, including JSON-LD):
- **VBS Closets & Cabinets**, operated by 1001273451 Ontario Inc.
- Phone 437-376-6267 (`tel:+14373766267`) · WhatsApp `https://wa.me/14373766267`
- Email vbscustom@gmail.com · Instagram @vbsclosetscabinets
- Based in Hamilton. Service area: **Hamilton, Burlington, Waterdown and the GTA.** (The legacy site also lists Oakville and Milton; keep them where a full list of towns is shown unless the owner says otherwise.)
- Process: Share the space → Define the build → Quote & schedule → Build & install.

## Before finishing any UI change

- [ ] Looks like premium millwork, not SaaS; nothing from the "avoid" list
- [ ] Token colours only; red reserved for the quote CTA
- [ ] Type from the scale; spacing on the 8px grid
- [ ] Real photos lead; any render is labelled "Design concept"; no repeats; accurate alt text
- [ ] Request a Quote visible and consistent; mobile nav + persistent call/quote access work
- [ ] No internal or placeholder copy visible; business facts match
- [ ] Works at 360 / 768 / 1024 / 1280px; keyboard-navigable; reduced motion respected
- [ ] No new dependencies added without explanation and approval
- [ ] `npm run build` passes
