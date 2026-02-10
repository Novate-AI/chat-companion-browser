

# Fix: No Timers for Introduction, Timers Only Start at Part 1

## Problem

1. **Introduction phases have unnecessary pending actions**: The intro phases (`INTRO`, `ASK_NAME`, `ASK_NICKNAME_ORIGIN`) schedule a `"mic_only"` pending action that waits for `isSpeaking` to go false. This adds latency since it depends on TTS state detection. There should be no timer and no pending action -- the system simply waits for the user to speak.

2. **Timers should only begin at Part 1**: Currently `ASK_ID` is treated as a timed phase. The ID check is still part of the introduction and should use the simple auto-advance pattern instead.

## Solution

### `src/pages/IeltsChat.tsx`

**`schedulePostAIAction` (lines 211-239):**
- Remove `INTRO`, `ASK_NAME`, `ASK_NICKNAME_ORIGIN` from the `waitForUserPhases` list and eliminate the `"mic_only"` action entirely
- For these intro phases, set NO pending action at all -- the mic-off-without-speech `useEffect` (line 132) and `sendMessage` already handle advancing when the user speaks or toggles the mic
- Move `ASK_ID` from the timed phases to the auto-advance phases (`ID_PAUSE` behavior: AI says "May I see your ID", then after speaking auto-advances to `ID_PAUSE` which says "Thank you")
- The `"mic_only"` action type can be removed entirely since no phase uses it anymore

**Updated `schedulePostAIAction` logic:**

| Phase | Action |
|-------|--------|
| `INTRO`, `ASK_NAME`, `ASK_NICKNAME_ORIGIN` | No pending action -- just wait for user to click mic |
| `ASK_ID` | `auto_advance` -- AI asks for ID, then auto-advances to `ID_PAUSE` |
| `ID_PAUSE`, `PART1_INTRO`, `PART2_INTRO`, `PART3_INTRO` | `auto_advance` -- AI speaks then moves on |
| `PART1_QUESTION`, `PART2_SPEAK`, `PART3_QUESTION` | `mic_and_timer` -- timer starts after AI speaks |
| `PART2_PREP` | `mic_and_timer` -- 60s prep timer |
| `CONCLUSION` | Nothing |

**Pending action effect (lines 90-129):**
- Remove the `"mic_only"` branch entirely
- Remove `ASK_ID` from the `"mic_and_timer"` branch

**`pendingActionRef` type (line 45):**
- Change from `"mic_only" | "mic_and_timer" | "auto_advance" | null` to `"mic_and_timer" | "auto_advance" | null`

### No changes needed in other files

`useIeltsTestFlow.ts` and `useSpeechRecognition.ts` remain unchanged.

## Result

- Introduction phases: AI speaks, then nothing happens automatically. User clicks mic when ready, speaks, mic off triggers next question immediately.
- Part 1/2/3: Timer starts only after AI finishes speaking the question. User clicks mic independently.
- No more lag during introduction since there's no pending action waiting on TTS state.

