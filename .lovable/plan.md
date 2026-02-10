

# Fix Voice Lag -- Stream Audio While Chat is Streaming

## Problem

The voice playback lags behind the chat text because of two sequential bottlenecks:
1. The app waits for the **entire chat response** to finish streaming before sending text to ElevenLabs
2. The ElevenLabs call waits for the **entire audio file** to be generated before playback begins

This creates a noticeable delay: chat finishes, then silence, then voice starts seconds later.

## Solution

Implement **chunked TTS** so audio starts playing while the chat is still streaming, and use ElevenLabs' streaming audio endpoint so playback begins before the full audio is generated.

## What Changes

### 1. Start TTS earlier with sentence chunking (`src/pages/Chat.tsx`)

Instead of waiting for the full response, detect complete sentences as they stream in and send each sentence to TTS immediately.

- Track which text has already been sent to TTS
- As new content streams in, extract complete sentences (split on `.` `!` `?`)
- Queue each sentence for TTS playback in order
- Remove the "wait for isLoading to flip" pattern

### 2. Stream audio from ElevenLabs (`supabase/functions/elevenlabs-tts/index.ts`)

Switch from buffering the full audio to streaming it through:

- Use ElevenLabs streaming endpoint (same URL, just pipe the response body directly instead of buffering with `arrayBuffer()`)
- Return the audio stream to the client as it arrives
- This alone cuts perceived latency by 1-3 seconds

### 3. Play audio as it streams (`src/hooks/useSpeechSynthesis.ts`)

Update the hook to support:

- A **queue system** for multiple text chunks (sentences) arriving over time
- Play chunks sequentially -- when one finishes, start the next
- Use `MediaSource` API or sequential `Audio` elements for gapless playback
- Keep the fallback to browser speech if ElevenLabs fails

## Files Modified

| File | Change |
|------|--------|
| `supabase/functions/elevenlabs-tts/index.ts` | Stream audio response instead of buffering the full file |
| `src/hooks/useSpeechSynthesis.ts` | Add a sentence queue system -- accept chunks, play them sequentially |
| `src/pages/Chat.tsx` | Send sentences to TTS as they stream in, rather than waiting for the full response |

## Technical Details

**Sentence chunking logic (Chat.tsx):**

The `processStream` function already assembles text token-by-token. We add a tracker for the last TTS position, and after each token, check if a new complete sentence has formed:

```text
spokenUpTo = 0
onNewContent(fullText):
  remaining = fullText.slice(spokenUpTo)
  sentences = split remaining on sentence boundaries (. ! ?)
  for each complete sentence (not the last partial one):
    queue sentence for TTS
    spokenUpTo += sentence.length
```

**Audio queue (useSpeechSynthesis.ts):**

```text
queue = []
isPlaying = false

speakQueued(text):
  queue.push(text)
  if not isPlaying: playNext()

playNext():
  if queue is empty: isPlaying = false; return
  isPlaying = true
  chunk = queue.shift()
  fetch TTS for chunk
  play audio
  on audio ended: playNext()
```

**Edge function streaming:**

Replace `await response.arrayBuffer()` with directly piping `response.body` to the client response. This means audio bytes start flowing to the browser as soon as ElevenLabs begins generating.

No new dependencies needed. ElevenLabs API usage stays the same (same endpoint, same model).
