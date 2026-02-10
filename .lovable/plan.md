

# Microphone Fix Implementation

## Changes

### `src/pages/IELTSChat.tsx` (3 edits)

**Edit 1 -- `startUserResponseWindow` (lines 160-171)**
Remove the `!isListening` guard and use `stopListening(false)` in the timer callback:

```typescript
const startUserResponseWindow = (seconds: number) => {
  setTimeout(() => {
    if (micSupported) startListening();
  }, 500);

  startCountdown(seconds, "Time remaining", () => {
    stopListening(false);
    advanceAfterUserResponse("(no response - time expired)");
  });
};
```

**Edit 2 -- `startUserResponseWindowLong` (lines 390-396)**
Use `stopListening(false)` in the timer callback:

```typescript
const startUserResponseWindowLong = (seconds: number) => {
  if (micSupported) startListening();
  startCountdown(seconds, "Speaking time", () => {
    stopListening(false);
    advanceAfterUserResponse("(speaking time ended)");
  });
};
```

No other files need changes -- the speech recognition hook already supports `stop(false)` from the previous edit.
