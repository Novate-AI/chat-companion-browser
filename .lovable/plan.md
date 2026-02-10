

# Fix: Keep Microphone Active for Full Response Window

## Root Cause

Two issues cause the current behavior:

1. **Speech recognition ends after one phrase**: The `useSpeechRecognition` hook uses `continuous = false`, so when the user pauses even briefly, the browser fires `onresult` which immediately calls `handleUserResponse`, stopping the timer and advancing to the next question -- even if 18 seconds remain.

2. **Mic breaks after auto-start**: Calling `SpeechRecognition.start()` inside `setTimeout` (as `startUserResponseWindow` does) loses the browser's "user gesture" context, causing permission errors and rendering the mic unusable.

## Solution

### 1. Continuous Speech Recognition with Auto-Restart (`src/hooks/useSpeechRecognition.ts`)

Rewrite the hook to:
- Set `continuous = true` so the browser keeps listening through pauses
- Use a ref (`shouldBeListeningRef`) to track whether we *intend* to be listening
- On the `onend` event, automatically restart recognition if we still intend to listen (browsers sometimes stop recognition due to silence -- this restarts it)
- Accumulate all transcripts during the window into a single string instead of firing `onResult` per phrase
- Only call `onResult` with the accumulated transcript when `stop()` is explicitly called
- Handle errors gracefully (`no-speech` is normal, `not-allowed` means permission denied)

### 2. Decouple Mic from Timer Advancement (`src/pages/IELTSChat.tsx`)

Change how user responses work during timed windows:
- Remove the pattern where `onVoiceResult` immediately calls `handleUserResponse` (which stops timers and advances)
- Instead, accumulate speech into a ref during the response window
- Only advance when the **countdown timer expires** (20s for Part 1, 120s for Part 2, 25s for Part 3)
- The user can also submit early via the text input or a "Done" action, but pausing speech alone will NOT advance

### 3. First Mic Activation from User Gesture

- The very first mic activation happens when the user clicks "Yes" / types their first response (a real user gesture)
- Subsequent auto-starts work because the permission is already granted and we use the auto-restart pattern in the `onend` handler
- Remove the `setTimeout(() => startListening(), 500)` pattern that breaks gesture context

## How It Works After the Fix

```
AI asks question -> AI finishes speaking -> Timer starts (20s/25s/120s)
                                             |
                                             v
                                    Mic activates, user speaks
                                    User pauses -> mic auto-restarts
                                    User speaks again -> transcript accumulates
                                             |
                                             v
                                    Timer hits 0 -> mic stops
                                                 -> accumulated transcript saved
                                                 -> advance to next question
```

The user gets the FULL duration regardless of pauses. Speech is accumulated, not treated as individual responses.

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useSpeechRecognition.ts` | Rewrite: `continuous = true`, auto-restart on `onend`, accumulate transcripts, only fire result on explicit stop |
| `src/pages/IELTSChat.tsx` | Decouple voice input from phase advancement; only advance on timer expiry or explicit user submit; remove `setTimeout` mic starts |

## Technical Details

**useSpeechRecognition.ts changes:**
- Add `shouldBeListeningRef` to track intent
- Add `accumulatedRef` to collect all speech during a window
- Set `continuous = true` on the recognition instance
- `onend`: if `shouldBeListeningRef.current` is true, call `recognition.start()` again (auto-restart)
- `onresult`: append transcript to `accumulatedRef`, do NOT call `onResult` callback
- New `stop()`: set `shouldBeListeningRef` to false, call `recognition.stop()`, then fire `onResult` with the full accumulated transcript
- `onerror`: handle `no-speech` (ignore, will auto-restart), `not-allowed` (stop and warn)

**IELTSChat.tsx changes:**
- `onVoiceResult` callback: instead of calling `handleUserResponse`, just append to a `pendingTranscriptRef`
- `startUserResponseWindow`: start mic + countdown; when countdown hits 0, stop mic, read `pendingTranscriptRef`, then call `advanceAfterUserResponse` with the accumulated text
- User can still type and submit manually (which stops timer + mic and advances immediately)
- For Part 2 long window: same pattern but 120s

