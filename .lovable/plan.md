

# Replace Avatar Image with Novate Persona Logo

## Overview
Replace the current character image (`src/assets/lingbot.png`) with the uploaded Novate Persona logo across the app.

## Steps

1. **Copy the uploaded logo** into `src/assets/lingbot.png` (overwrite the existing file) so all existing imports continue to work without any code changes.

2. **Remove the rounded-full and border styles** from `LingbotAvatar.tsx` since the new image is a logo with a transparent background, not a circular photo. The circular crop and border would cut off the logo awkwardly.

## Files Changed

| File | Change |
|------|--------|
| `src/assets/lingbot.png` | Replaced with the Novate Persona logo |
| `src/components/LingbotAvatar.tsx` | Remove `rounded-full`, `overflow-hidden`, `border-4`, and adjust styling for a logo display instead of a circular avatar |

