# Design System

Noor Hub’s visual language is **premium, minimal, and peaceful** — a mobile companion, not an
admin dashboard. Deep emerald and cream carry the identity; gold is an accent used sparingly;
Islamic geometry appears only as a subtle texture. The reference for the feel was a
Muslim-Pro-style mobile UI: rounded cards, generous whitespace, calm motion, and beautiful
Arabic typography set apart from readable English.

All tokens live in `apps/web/tailwind.config.js` and `apps/web/src/styles/index.css`.

---

## 1. Principles

1. **Mobile-first, thumb-friendly.** Primary actions sit within reach; the bottom tab bar and
   44px+ touch targets are the default, and the layout scales up to a desktop sidebar.
2. **Calm over clever.** Motion is gentle and purposeful; nothing flashes, bounces aggressively,
   or competes for attention.
3. **Arabic is honored, not crammed.** Quranic and dhikr text uses a dedicated serif face with
   relaxed line-height and RTL isolation, visually distinct from UI English.
4. **Non-judgmental tone.** Copy encourages without shaming; missed prayers and empty streaks are
   met with neutrality, never guilt.
5. **Honest about state.** Online/offline, guest/account, and “needs internet” are always visible.

---

## 2. Color

### Brand palette (Tailwind `theme.extend.colors`)

| Token      | Values (50 → 950) | Role |
|------------|-------------------|------|
| `emerald`  | `#eff7f1` … `#0b211b` (500 `#36795a`, 700 `#174b3a`, 800 `#123c30`) | Primary brand; headers, active nav, buttons |
| `sage`     | `#f3f6e9` … `#3d4929` (200 `#dce7b5`, 500 `#8da653`) | Secondary/organic accent; avatars, chips |
| `gold`     | `#fbf8eb` … `#5b3a20` (400 `#d3ad42`, 500 `#bd922d`) | Sparse highlight; focus ring, offline banner, brand dot |
| `clay`     | `#f6e3dc` … `#a65b46` | Warm tertiary for tags/illustration |

Neutrals: `cream #faf9f4`, `paper #ffffff`, `ink #20382e`, `muted #6c7c72`.
Dark surfaces: `night #101d19`, `night-card #192b23`, `night-soft #22382d`.

### Semantic CSS variables (theme-switchable)

The base layer defines variables that flip with the `.dark` class, so components reference
**meaning**, not raw hex:

| Variable     | Light      | Dark       | Used for |
|--------------|------------|------------|----------|
| `--page`     | `#faf9f4`  | `#101d19`  | App background |
| `--surface`  | `#ffffff`  | `#192b23`  | Cards, nav, inputs |
| `--text`     | `#20382e`  | `#edf2e8`  | Body copy |
| `--muted`    | `#6c7c72`  | `#a1b4a6`  | Secondary copy |
| `--line`     | `#e7ebe2`  | `#2c4034`  | Borders, dividers |
| `--soft`     | `#f1f4ec`  | `#22382d`  | Subtle fills, hover |

`color-scheme` is set per theme so native form controls and scrollbars follow.

### Usage rules

- **Emerald 700** is the primary action color in light mode; **emerald 500** in dark mode
  (brighter for contrast on dark surfaces).
- **Gold** is reserved for focus indication, the brand dot after “noor hub”, and the offline
  banner — never for large fills.
- Status: online dot `emerald-500`, offline dot/banner `gold-500`/`gold-100`.

---

## 3. Typography

| Face | Source | Use |
|------|--------|-----|
| **Manrope Variable** | `@fontsource-variable/manrope` | All UI/English text (`font-sans`) |
| **Amiri** | `@fontsource/amiri` (arabic 400/700 + latin) | Arabic text (`font-arabic`, `.arabic`) |

- Body: Manrope, antialiased. Headings are `font-extrabold` with tight tracking
  (`.page-title` 28px → 36px at `md`, `.section-title` 18px).
- **`.arabic`** class: `font-family: Amiri; direction: rtl; unicode-bidi: isolate;
  line-height: 2.15`. The isolate keeps RTL Quranic/duʿāʾ text from disturbing surrounding LTR
  layout, and the tall line-height gives diacritics room.
- `.eyebrow`: 10px, extrabold, uppercase, `0.18em` tracking — for small overline labels.

---

## 4. Elevation, radius & spacing

- **Radius:** cards and sheets are heavily rounded (`rounded-3xl` = 1.5rem for `.surface`;
  buttons/inputs `rounded-xl`; a `4xl` = 2rem token exists for hero panels). This is central to
  the soft, premium feel.
- **Shadows:** three soft, green-tinted shadows rather than grey ones —
  `shadow-soft` (resting cards), `shadow-lift` (modals/elevated), `shadow-nav` (bottom bar,
  cast upward).
- **Spacing:** the `.page` container is `max-w-6xl`, `px-5` (mobile) → `px-8` (`md`), with
  `pb-32` on mobile to clear the bottom nav and `pb-16` on desktop.
- **Geometry:** a `.geometric` utility overlays a faint 8-point-star SVG pattern (10% white
  stroke) on emerald hero panels — used sparingly for texture, never as busy background.

---

## 5. Components

Base component classes are defined in `styles/index.css` (`@layer components`) and composed
with primitives in `components/ui/index.jsx`.

| Class / component | Purpose |
|-------------------|---------|
| `.surface` | Card: `--surface` bg, 1px `--line` border, `rounded-3xl`, `shadow-soft` |
| `.soft` | Subtle filled region using `--soft` |
| `.btn-primary` | Emerald action button, `min-h-12`, hover→emerald-600, `active:scale-[.98]` |
| `.btn-secondary` | Neutral button on `--soft` |
| `.icon-button` | 44×44 circular icon affordance with hover fill + `active:scale-95` |
| `.input` | `min-h-12` field, focus ring `emerald-500/20`, `--surface` bg |
| `.muted` / `.line` | Semantic text/border color helpers |
| `.skeleton` | Shimmering loading placeholder (`animate-shimmer`) |
| `LoadingState`, `ErrorState` | Suspense fallback and calm error recovery |
| `Modal` | Accessible dialog (used by the “More” sheet, auth, location, confirm) |
| `Card`, `Button`, `Tabs` | Layout/interaction primitives |

Every interactive element meets a **44px minimum touch target** (`min-h-11`/`min-h-12`/
`min-h-14`), and `-webkit-tap-highlight-color` is disabled in favor of explicit hover/active
states.

---

## 6. Motion

- **Framer Motion** drives route/panel transitions and micro-interactions. `MotionConfig`
  sets `reducedMotion="user"`, so the app honors the OS “reduce motion” setting globally.
- **Keyframes** (Tailwind): `breathe` (8s opacity/scale pulse for ambient backgrounds) and
  `shimmer` (1.7s skeleton sweep).
- **Tactile feedback:** buttons scale slightly on press (`active:scale-[.98]` /
  `active:scale-95`); the tasbih counter pairs increment with optional **haptics**
  (`navigator.vibrate`, gated by the `haptics` preference).
- A `prefers-reduced-motion` media query collapses all animation/transition durations to
  `0.01ms` and disables smooth scrolling as a hard fallback.

---

## 7. Dark mode

- Strategy: Tailwind `darkMode: 'class'`. The `.dark` class is toggled on the root by
  `PreferencesProvider` from the `theme` preference (`light` / `dark` / `system`).
- Because components reference the `--*` variables, most surfaces switch automatically;
  brand colors use explicit `dark:` variants where a brighter tone is needed for contrast
  (e.g. `dark:bg-emerald-500`, `dark:hover:bg-night-soft`).
- The header exposes a one-tap sun/moon toggle; the state persists across reloads.

---

## 8. Accessibility

- **Skip link:** “Skip to content” jumps to `#main-content` on focus.
- **Focus visibility:** `:focus-visible` draws a 2px **gold** ring with 4px offset — high
  contrast against both emerald and cream.
- **Semantics:** landmark regions (`header`, `aside`, `main`, `nav` with `aria-label`),
  `aria-label`/`title` on icon-only buttons, and labelled form fields.
- **Reduced motion** honored (see §6).
- **Contrast:** text/background pairs are chosen to stay legible in both themes; muted copy
  uses `--muted` tuned per theme rather than a single fixed grey.
- **Responsive:** fluid from 360px phones to desktop; no horizontal overflow (asserted by QA).

---

## 9. Responsive behavior

| Breakpoint | Layout |
|------------|--------|
| `< lg` (mobile/tablet) | Sticky header + fixed **bottom tab bar** (5 primary), “More” sheet for the rest, `pb-32` content padding |
| `≥ lg` (desktop) | Fixed **left sidebar** (`w-60`) with primary + companion nav, install button, footer; content `lg:pl-60`, `max-w-6xl` centered |

The design was validated at **390×844 (mobile, touch, DPR 2)** and **1440×900 (desktop)**
across all 17 routes; see `docs/PHASE-1.md` for the QA results.
