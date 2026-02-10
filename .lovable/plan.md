

# Complete Landing Page Overhaul -- Premium HTML5 Experience

## Problem
- The logo PNG has a background that doesn't blend into the dark page
- The overall design still feels generic and template-like
- Needs to feel like a high-end product launch page, not a card layout

## Design Direction

A cinematic, single-page experience inspired by sites like Stripe, Linear, and Vercel -- bold typography, particle-like effects, and interactive hover states that feel alive.

## Changes

### 1. Logo Treatment (`src/pages/Index.tsx`)
- Place the logo inside a circular container with a matching dark background and a glowing ring border
- Apply `mix-blend-mode: lighten` or `screen` to remove the white background from the PNG
- Surround it with a pulsing glow ring that matches the brand gradient
- Alternatively, use `rounded-full overflow-hidden bg-[#0a0b14]` with the image on top so it blends seamlessly

### 2. Full Page Redesign (`src/pages/Index.tsx`)
Replace the current layout with a more cinematic structure:

**Hero Section:**
- Much larger, bolder heading with individual word color accents (not just gradient text)
- Animated typing-style subtitle or a simple fade-in tagline
- Logo centered above with a glowing halo effect
- A subtle grid/dot pattern overlay on the background for depth

**Product Section -- Interactive Hover Panels:**
- Instead of basic cards, use full-width horizontal panels (on desktop) or stacked panels (mobile)
- Each panel has: icon, title, one-liner, and an arrow
- On hover, the panel expands slightly, reveals the full description, and the product's accent color floods the left border and icon
- Smooth transitions with `max-height` and opacity

**Animated Background:**
- Replace simple blurred orbs with a CSS-only animated mesh/grid pattern
- Add a subtle noise texture overlay via CSS for a premium feel
- Thin horizontal lines or dots that give a "tech grid" look

**Bottom CTA area:**
- A simple "Built by Novate" tagline with a subtle gradient underline

### 3. New CSS Utilities (`src/index.css`)
- `.noise-overlay` -- a pseudo-element with a subtle noise SVG background for texture
- `.grid-pattern` -- repeating linear gradient to create a faint grid
- `.glow-ring` -- keyframed ring glow animation for the logo
- Update `.glass-card` to have stronger blur and more pronounced border glow on hover

### 4. New Tailwind Keyframes (`tailwind.config.ts`)
- `ring-pulse`: a scale + opacity animation for the logo's glow ring
- `shimmer`: a left-to-right highlight sweep for interactive elements

## Technical Details

**Logo blending approach:**
```css
.logo-blend {
  mix-blend-mode: lighten; /* removes white bg on dark backgrounds */
  filter: brightness(1.1);
}
```

**Grid pattern overlay:**
```css
.grid-pattern {
  background-image: 
    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
}
```

**Panel layout (desktop):**
```text
+------------------------------------------------------+
|  [icon]  Novatutor                              ->   |
|          AI Language Tutor                            |
|          (description appears on hover)               |
+------------------------------------------------------+
|  [icon]  Nova IELTS                             ->   |
|          AI IELTS Speaking Coach                      |
+------------------------------------------------------+
|  [icon]  NovaPatient                            ->   |
|          AI Patient for Clinical Practice             |
+------------------------------------------------------+
```

Each panel is a full-width glassmorphism strip with the product's accent color on the left edge, expanding on hover to reveal description text.

## Files Modified
- `src/pages/Index.tsx` -- full rewrite
- `src/index.css` -- add noise overlay, grid pattern, glow-ring utilities
- `tailwind.config.ts` -- add ring-pulse and shimmer keyframes

## No new dependencies needed.
