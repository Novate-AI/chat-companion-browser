

# Redesign: Futuristic Novate Persona Landing Page

## Overview
Transform the bland landing page into a sleek, modern, futuristic design with a dark theme, glowing accents, animated gradients, and glassmorphism cards.

## Design Direction
- **Dark background** with subtle animated gradient mesh (deep navy/purple tones)
- **Glassmorphism cards** with backdrop blur, semi-transparent backgrounds, and glowing border accents on hover
- **Animated floating glow orbs** in the background for depth and movement
- **Gradient text** on the main heading for a futuristic feel
- **Staggered fade-in animations** on page load for cards
- **Glowing icon containers** with each product's signature color
- **Smooth hover effects** -- cards lift, borders glow, icons pulse

## Changes

### 1. tailwind.config.ts
- Add custom keyframes: `float`, `glow-pulse`, `fade-in-up` (staggered entrance), `gradient-shift` (background animation)
- Add corresponding animation utilities

### 2. src/pages/Index.tsx (full rewrite)
- Dark background with CSS animated gradient mesh
- Floating decorative glow orbs (absolute-positioned, blurred colored divs)
- Logo with a subtle glow/drop-shadow effect
- Heading with a gradient text effect (transparent bg-clip)
- Subtitle with a softer tone
- Three glassmorphism product cards:
  - Semi-transparent dark background with backdrop-blur
  - Colored left border or top glow line matching product color
  - Icon in a glowing circular container
  - Hover: card lifts, border glows brighter, subtle scale
  - Staggered entrance animation (delay per card)
  - Arrow CTA animates on hover
- Minimal footer with muted text

### 3. src/index.css
- Add a utility class for gradient text (`.gradient-text`)
- Add glass card utility (`.glass-card`)

## Visual Result
A dark, immersive landing page that feels like a premium AI product -- clean typography, glowing accents, smooth animations, and glassmorphism depth. Simple but striking.

## Technical Details

**New Tailwind keyframes:**
- `float`: gentle up/down float for background orbs
- `glow-pulse`: opacity pulse for glow effects  
- `fade-in-up`: translateY + opacity for card entrances
- `gradient-shift`: background-position animation for the mesh gradient

**Card structure (per product):**
```text
+------------------------------------------+
|  [glow top border - product color]       |
|                                          |
|  ( icon )   Title                        |
|             Subtitle                     |
|                                          |
|  Description text...                     |
|                                          |
|  Launch ->                               |
+------------------------------------------+
```

**No new dependencies needed** -- pure Tailwind + CSS.
