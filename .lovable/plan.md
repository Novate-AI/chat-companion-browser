

# Improve Voice Quality and Add Kid-Safe Content

## Overview

Three focused improvements using the free browser Web Speech API (no external services or API keys needed):

1. **Kid-safe content moderation** -- add strict rules to the AI system prompt so all conversations are appropriate for children
2. **Natural speech formatting** -- instruct the AI to write in a way that sounds natural when read aloud (proper quoting, contractions, flowing sentences)
3. **Better browser voice selection** -- upgrade the `useSpeechSynthesis` hook to automatically pick the highest-quality voice available on the user's device (prefer Google/Microsoft voices over default system voices) and tune rate, pitch, and pauses for more natural delivery

## What Changes

### 1. System Prompt Updates (`supabase/functions/chat/index.ts`)

**Kid-safe rules added to the system prompt:**
- All content must be suitable for children aged 8 and above
- Never discuss violence, profanity, sexual content, drugs, or any mature themes
- If the user steers toward inappropriate topics, gently redirect back to language learning with a fun alternative topic
- Keep all examples, vocabulary, and topics family-friendly (animals, food, school, hobbies, travel, sports, family)

**Natural speech formatting rules:**
- When correcting a phrase, write naturally -- e.g., *You should say, "Where are you from?"* -- never use code formatting, asterisks, or bullet points
- Use commas for short pauses and periods for longer ones to create natural rhythm
- Use contractions as people actually speak ("don't", "I'm", "let's")
- Write in flowing sentences, not numbered lists or bullet points during conversation
- Avoid technical grammar jargon -- explain corrections in simple, conversational words

### 2. Smarter Voice Selection (`src/hooks/useSpeechSynthesis.ts`)

The current implementation uses whatever default voice the browser provides, which is often robotic. The upgrade will:

- On load, enumerate all available `speechSynthesis` voices using `getVoices()`
- Score each voice by quality preference:
  - Prefer voices containing "Google", "Microsoft", or "Natural" in the name (these are higher quality on Chrome/Edge)
  - Prefer voices matching the exact language code (e.g., `en-GB` for English)
  - Fall back to any voice matching the base language
- Cache the selected voice so it stays consistent during the session
- Set `pitch` to `1.0` and `rate` to `0.85` for a calmer, more natural pace (slightly slower than current `0.9`)
- Handle the Chrome quirk where `getVoices()` returns empty until the `voiceschanged` event fires

### 3. Files Modified

| File | Change |
|------|--------|
| `supabase/functions/chat/index.ts` | Add kid-safe rules and natural speech formatting instructions to the system prompt |
| `src/hooks/useSpeechSynthesis.ts` | Add smart voice selection logic that picks the best available voice, tune rate and pitch |

No new dependencies, no new API keys, no new edge functions needed. Everything stays free.

## Technical Details

**Voice selection scoring algorithm:**

```text
For each voice in speechSynthesis.getVoices():
  score = 0
  if voice.lang matches exact target (e.g., "en-GB")  -> score += 10
  if voice.lang matches base language (e.g., "en-*")   -> score += 5
  if voice.name contains "Google"                       -> score += 3
  if voice.name contains "Microsoft"                    -> score += 3
  if voice.name contains "Natural"                      -> score += 2
  if voice.localService is false (network voice)        -> score += 1

Pick the voice with the highest score.
```

**Chrome voices quirk handling:**
- `speechSynthesis.getVoices()` often returns `[]` on first call in Chrome
- Listen for the `voiceschanged` event and re-select when voices become available
- Use a `useEffect` with cleanup to manage the event listener

**System prompt additions (appended after existing rules):**

Kid-safe block:
- "All content must be suitable for children aged 8 and above. Never use or discuss profanity, violence, sexual content, drugs, alcohol, or any mature themes."
- "If the user tries to discuss inappropriate topics, respond warmly with something like: 'That is not really my area! How about we learn some fun words about [animals/food/sports] instead?'"
- "Keep all vocabulary examples and conversation topics family-friendly."

Natural speech block:
- "When correcting a user's phrase, write it naturally. For example, write: You should say, 'Where are you from?' Never use code formatting, markdown, or asterisks."
- "Use commas for short pauses and periods for longer pauses to create natural speech rhythm."
- "Use contractions like a real person would: 'don't' instead of 'do not', 'I'm' instead of 'I am', 'let's' instead of 'let us'."
- "Write in flowing, conversational sentences. Avoid numbered lists or bullet points in your main response."

