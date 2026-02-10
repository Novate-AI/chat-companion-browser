

# Fix: Microphone Not Working in IELTS Chat

## Problem

The continuous speech recognition changes broke the microphone. Two issues:

1. **Stale state in `startUserResponseWindow`**: The function checks `!isListening` inside a `setTimeout`, but `isListening` is a stale React state value from the render when the function was created -- it never reflects the current value inside the timeout.

2. **Auto-restart race condition**: In continuous mode, when `recognition.stop()` is called, the `onend` handler fires and tries to restart recognition. But if `recognitionRef.current` hasn't been set to `null` yet (which only happens in the explicit `stop()` function), the auto-restart kicks in and conflicts with the next `start()` call, causing the browser to silently kill the mic.

## Fix

### File: `src/hooks/useSpeechRecognition.ts`

- Use an `isListeningRef` (ref, not just state) to control auto-restart decisions, so the `onend` handler always sees the current value.
- In the `onend` handler, check `isListeningRef.current` instead of `recognitionRef.current` to decide whether to auto-restart.
- In `stop()`, set `isListeningRef.current = false` **before** calling `rec.stop()`, so the `onend` handler knows not to restart.

### File: `src/pages/IELTSChat.tsx`

- Remove the stale `!isListening` guard in `startUserResponseWindow`. Instead, always call `startListening()` -- the hook itself should handle being called when already listening (no-op or restart).
- Add a guard inside `start()` of the hook to prevent double-starts (if already listening, return early).

## Technical Details

**useSpeechRecognition.ts changes:**
```
// Add a ref to track listening state for async callbacks
const isListeningRef = useRef(false);

// In start():
isListeningRef.current = true;

// In onend:
if (continuous && isListeningRef.current) {  // <-- ref, not recognitionRef
  try { recognition.start(); } catch { ... }
}

// In stop():
isListeningRef.current = false;  // <-- set BEFORE calling rec.stop()
recognitionRef.current = null;
rec?.stop();
```

**IELTSChat.tsx changes:**
- Line 166: Remove the `!isListening` check, just call `startListening()` directly
- The hook's `start()` will handle the case where it's already listening

These are minimal, targeted fixes that address the race condition without changing the overall architecture.

