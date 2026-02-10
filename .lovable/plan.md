

# Nova IELTS -- Full IELTS Speaking Test Simulator

## Overview

Build a complete IELTS Speaking test simulation that follows the real exam structure (Parts 1, 2, and 3) with timed sections, automatic microphone control, and IELTS-specific band score feedback.

## Architecture

The IELTS mode reuses the existing chat infrastructure (ElevenLabs TTS, streaming, speech recognition) but adds a **state machine** to control the exam flow, timers, and automatic microphone toggling. A new edge function handles the IELTS-specific system prompt, and the feedback edge function gets an IELTS-specific scoring mode.

## What Gets Built

### New Files

| File | Purpose |
|------|---------|
| `src/pages/NovaIelts.tsx` | Landing page for Nova IELTS (similar to Novatutor but without language selector) |
| `src/pages/IeltsChat.tsx` | The IELTS test chat page with timer, state machine, and auto-mic logic |
| `src/hooks/useIeltsTestFlow.ts` | State machine hook managing the test phases, timers, and question sequencing |
| `supabase/functions/ielts-chat/index.ts` | Edge function with IELTS examiner system prompt and structured question bank |
| `supabase/functions/ielts-feedback/index.ts` | Edge function that generates IELTS band score feedback (1-9) with detailed breakdown |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add routes for `/novaielts` and `/ielts-chat` |

## Test Flow State Machine

The test follows this exact sequence:

```
INTRO -> ASK_NAME -> ASK_NICKNAME_ORIGIN -> ASK_ID -> ID_PAUSE -> PART1_INTRO -> PART1_QUESTIONS (x12) -> PART2_INTRO -> PART2_PREP (1 min) -> PART2_SPEAK (2 min) -> PART3_INTRO -> PART3_QUESTIONS (x6) -> CONCLUSION
```

### Phase Details

1. **INTRO**: AI says "We are going to start IELTS speaking test practice. Are you ready?" -- waits for user reply
2. **ASK_NAME**: AI says "Ready, hello my name is Tom, can you tell me your full name please?" -- waits for reply
3. **ASK_NICKNAME_ORIGIN**: AI says "And what shall I call you and can you tell me where you're from?" -- waits for reply
4. **ASK_ID**: AI says "May I see your identification please?" -- waits 5 seconds or user reply
5. **ID_PAUSE**: AI says "Thank you, that's fine."
6. **PART1_INTRO**: AI explains Part 1 rules, then immediately starts questions
7. **PART1_QUESTIONS**: 12 questions on a common theme. Each question gets a 15-20 second timer. Mic auto-activates at start, deactivates when timer ends or AI speaks. AI moves to next question regardless of whether user finished.
8. **PART2_INTRO**: AI introduces Part 2, presents a cue card topic with bullet points
9. **PART2_PREP**: 1-minute countdown timer displayed on screen. User prepares (mic off)
10. **PART2_SPEAK**: Mic auto-activates for exactly 2 minutes. Timer displayed. Mic cuts at 2:00
11. **PART3_INTRO**: AI introduces Part 3
12. **PART3_QUESTIONS**: 6 questions related to the Part 2 topic. Each gets 20-25 seconds. Same auto-mic behavior as Part 1
13. **CONCLUSION**: AI thanks the user and ends the test

## IELTS Question Bank

The edge function will contain a curated bank of IELTS speaking questions organized by theme, embedded directly in the code (no external API needed):

**Part 1 themes** (12 questions each): Home/Accommodation, Work/Studies, Hobbies, Daily Routine, Food, Weather, Transport, Reading, Music, Sports, Shopping, Technology

**Part 2 cue cards**: Describe a place you visited, a person who influenced you, a skill you learned, a memorable event, an important decision, etc.

**Part 3 questions**: Abstract/analytical questions thematically linked to the Part 2 topic

## Timer and Mic Auto-Control

The `useIeltsTestFlow` hook manages:
- A visible countdown timer (displayed in the chat header area)
- Auto-starting the mic when the user's answer window begins
- Auto-stopping the mic and sending whatever was captured when time expires
- Transitioning to the next question automatically

The timer UI will show as a progress bar or countdown in the header, color-coded (green to red as time runs out).

## IELTS Feedback Report

The `ielts-feedback` edge function produces a detailed IELTS-format report:

- **Fluency and Coherence** (Band 1-9 + explanation)
- **Lexical Resource** (Band 1-9 + explanation)
- **Grammatical Range and Accuracy** (Band 1-9 + explanation)
- **Pronunciation** (Band 1-9 + explanation)
- **Overall Band Score** (average of 4 criteria)
- **Strengths** highlighted from the conversation
- **Areas for Improvement** with specific suggestions
- **Sample improved answers** for 2-3 weak responses

## Technical Details

### Edge Function: `ielts-chat`

Similar to the existing `chat` edge function but with an IELTS examiner persona. The system prompt instructs the AI to:
- Stay in character as examiner "Tom"
- Follow the scripted intro sequence exactly (name, origin, ID)
- NOT deviate from the test format
- Ask questions from the embedded question bank
- Keep responses short and examiner-like (no teaching, no corrections during the test)
- Use the same streaming response format as the existing chat function

The client sends a `phase` parameter so the edge function knows which part of the test is active and adjusts behavior accordingly.

### Timer Implementation (`useIeltsTestFlow.ts`)

```text
State: { phase, questionIndex, timerSeconds, isTimerRunning, isPrepTime }

startTimer(duration):
  set timerSeconds = duration
  set isTimerRunning = true
  interval: decrement timerSeconds every 1s
  when timerSeconds = 0:
    stop mic
    advance to next question or phase

advanceQuestion():
  if part1 and questionIndex < 12: next question
  if part2_prep: switch to part2_speak (2 min)
  if part3 and questionIndex < 6: next question
  else: conclude
```

### Auto-Mic Flow

```text
AI finishes speaking ->
  if user's turn:
    start mic automatically
    start timer (15-20s for Part 1, 120s for Part 2, 20-25s for Part 3)
  
Timer expires OR user stops talking ->
  stop mic
  send captured text as user message
  AI asks next question
```

### Chat Page (`IeltsChat.tsx`)

Reuses the same components as `Chat.tsx` (ChatBubble, ChatInput, ScrollArea, ElevenLabs TTS) but adds:
- Timer display in header (countdown + progress bar)
- Phase indicator ("Part 1 - Question 3/12")
- Prep time countdown for Part 2
- Disabled text input during timed sections (voice-only)
- "View Report" button at conclusion (opens feedback dialog with IELTS-specific scoring)

### Landing Page (`NovaIelts.tsx`)

Similar to Novatutor but:
- No language selector (IELTS is English only)
- Rose/red color scheme (matching the existing card)
- "Start Practice Test" button navigates to `/ielts-chat`
- Brief explanation of what the test covers

