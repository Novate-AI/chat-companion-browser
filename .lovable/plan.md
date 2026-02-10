

# Fix IELTS Test Flow -- Eliminate Stale Closures

## Root Cause

The `advancePhase` function in `useIeltsTestFlow.ts` captures `phase` from its `useCallback` closure. When called from `sendMessage` (which is also memoized), it reads a stale `phase` value. Similarly, `triggerAIMessage` is a plain function captured stale inside `sendMessage`'s `useCallback`.

This means after the user says "yes" (INTRO phase), `advancePhase` correctly returns ASK_NAME. But when the user then says their name, the stale `advancePhase` still sees phase="INTRO" and returns ASK_NAME again -- creating an infinite loop on the name question.

## Fix: Use Refs for Mutable State

### 1. `src/hooks/useIeltsTestFlow.ts` -- Use refs inside `advancePhase`

Add `phaseRef` and `questionIndexRef` that stay in sync with state. Make `advancePhase` read from the refs instead of the closure, so it always has the latest values. This makes `advancePhase` stable (no deps on phase/questionIndex) and always correct.

```
phaseRef.current = phase         // synced via useEffect
questionIndexRef.current = questionIndex

advancePhase():
  switch (phaseRef.current) ...  // reads latest, not stale closure
  setPhase(next)
  phaseRef.current = next        // update ref immediately too
  return next
```

### 2. `src/pages/IeltsChat.tsx` -- Use ref for `triggerAIMessage`

Add a `triggerAIMessageRef` so that `sendMessage` always calls the latest version. This prevents stale `messages`, `questionIndex`, etc. from being sent to the edge function.

- Create `triggerAIMessageRef` pointing to `triggerAIMessage`
- Keep it in sync via `useEffect`
- `sendMessage` calls `triggerAIMessageRef.current(nextPhase)` instead of `triggerAIMessage(nextPhase)` directly

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/useIeltsTestFlow.ts` | Add `phaseRef` and `questionIndexRef`, make `advancePhase` read from refs |
| `src/pages/IeltsChat.tsx` | Add `triggerAIMessageRef`, use it in `sendMessage` |

