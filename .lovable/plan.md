

# Fix: Remove Auto-Mic and Ensure Next Question Always Fires

## Problems Identified

1. **Auto-mic activation**: The mic starts automatically after AI speaks, which is unreliable and unwanted. User wants manual control.
2. **Stuck flow**: When the user stops speaking or turns off the mic without a speech result being captured, `sendMessage` is never called, so the test gets stuck -- no next question is asked.

## Root Cause

Currently, `onResult` (speech recognized) calls `sendMessage`, which calls `advancePhase` + `triggerAIMessage`. But if the user toggles the mic off without speaking (or speech recognition ends with no result), nothing triggers the next question. The timers help for timed phases, but intro phases have no timer fallback.

## Solution

### 1. Remove all automatic mic activation (`src/pages/IeltsChat.tsx`)

- Remove the `"mic_only"` pending action entirely -- it auto-started the mic after AI spoke during intro phases
- In `"mic_and_timer"`, remove the `startListening()` calls -- only start the timer, not the mic
- The user will click the mic button themselves when ready to speak

### 2. Detect mic-off-without-speech and auto-advance (`src/pages/IeltsChat.tsx`)

Add a `useEffect` that watches `isListening`. When it transitions from `true` to `false`:
- Check if the last message in the conversation is still from the **assistant** (meaning the user's speech was NOT captured as a message)
- If so, AND we're in a user-turn phase, automatically advance to the next question
- This covers: user clicks mic off without speaking, or speech recognition ends with an error/no-speech

This also handles the case where speech IS captured: `onResult` fires `sendMessage` which adds a user message, so the check (`last message is assistant`) will be false and we won't double-advance.

### 3. Keep timers as-is for timed phases

Timers still auto-advance when they expire (Part 1, Part 2, Part 3). This is independent of mic state.

## Changes

### `src/pages/IeltsChat.tsx`

**Pending action effect (lines 88-130):**
- `"mic_only"` action: change from `startListening()` to doing nothing (just wait for user to click mic) -- or remove this action type entirely and use `"timer_only"` concept
- `"mic_and_timer"` action: remove `startListening()` calls, keep only `startTimer()`

**New effect -- watch for mic turning off:**
```
useEffect that tracks isListening going false:
  - Use a ref (wasListeningRef) to detect the transition
  - When isListening goes from true to false:
    - Check if last message is from "assistant" (no user speech was captured)
    - If yes and not loading, advance phase and trigger next AI question
```

**`handleMicToggle` (line 291-293):** No changes needed -- user clicks to start/stop.

### `src/hooks/useSpeechRecognition.ts`

No changes needed.

### `src/hooks/useIeltsTestFlow.ts`

No changes needed.

## Flow After Fix

```
AI finishes speaking
  -> For intro phases: nothing happens, user clicks mic when ready
  -> For timed phases: timer starts (no mic), user clicks mic when ready

User clicks mic ON -> speaks -> speech recognized -> onResult -> sendMessage -> advance
User clicks mic ON -> clicks OFF without speaking -> isListening goes false -> auto-advance
Timer expires -> advance (regardless of mic state)
```

