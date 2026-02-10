
# Fix IELTS Mic Persistence, Timer Display, and Text/Audio Mismatch

## Issues to Fix

1. **Part 1: Mic stops after one utterance** -- The speech recognition uses `continuous: false`, so the mic deactivates once the user pauses. Need to keep it alive for the full 20 seconds.
2. **Part 1: Timer should be 20 seconds** -- Currently set to 17 seconds.
3. **Part 2: Mic stops after one utterance** -- Same issue; mic must stay active for the full 2 minutes.
4. **Part 3: Text/audio mismatch** -- The AI is asked to "ask this question naturally," which means it rephrases the question. The text bubble shows one wording while the audio speaks a different wording. Both come from the same stream, so the real fix is to remove the AI's freedom to rephrase -- pass the exact question text directly.

## Changes

### 1. `src/hooks/useSpeechRecognition.ts` -- Enable continuous listening with auto-restart

- Set `continuous: true` so the mic stays open across pauses
- Instead of calling `onResult` and stopping, accumulate transcript text
- On `onend`, auto-restart the recognition (browsers often stop it after silence) so it keeps listening until explicitly stopped
- The hook will collect all spoken text and only call `onResult` with the full accumulated transcript when `stop()` is called

### 2. `src/pages/IELTSChat.tsx` -- Fix timers and remove AI rephrasing

- **Part 1**: Change timer from 17s to 20s
- **Part 3**: Keep timer at 22s (within the 20-25s range)
- **Text/audio mismatch fix**: For Part 1 and Part 3 questions, instead of telling the AI to "ask this question naturally," use `"Say exactly: [question]"`. This ensures the text displayed matches the audio exactly.
- **Mic handling**: When the timer expires, call `stop()` on speech recognition which will flush accumulated text as the user's response, then advance.
- **Part 2**: The `startUserResponseWindowLong` function already starts the mic -- with continuous mode enabled, it will now stay active for the full 2 minutes.

## Technical Details

### Speech Recognition (continuous mode)

The current hook creates a new `SpeechRecognition` instance with `continuous: false`. The browser fires one `onresult` event and stops. The fix:

- Set `continuous: true` and `interimResults: false`
- On each `onresult` event, append the new transcript to an accumulated ref
- On `onend` (which browsers fire after extended silence even in continuous mode), auto-restart unless explicitly stopped
- When `stop()` is called, flush the accumulated transcript via `onResult` callback, then reset

### Exact question text (no AI rephrasing)

Current instruction for Part 1 Q2+:
```
Ask this question naturally: [question]
```

Changed to:
```
Say exactly: [question]
```

This eliminates the mismatch between displayed text and spoken audio, since both come from the same AI stream.

## Files Modified

| File | Change |
|------|--------|
| `src/hooks/useSpeechRecognition.ts` | Enable continuous mode with auto-restart; accumulate transcript; flush on stop |
| `src/pages/IELTSChat.tsx` | Part 1 timer 17s to 20s; use "Say exactly" for Part 1 and Part 3 questions; keep mic active throughout response windows |
