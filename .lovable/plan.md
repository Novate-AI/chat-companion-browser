

# Replace Avatar with Video-Based AI Tutor "Novate Abby"

## Overview
Replace the static Tom Holland avatar with a pre-generated video avatar ("Novate Abby") that plays specific video segments synchronized with scripted text bubbles during the intro sequence. Audio comes from the video itself, not TTS.

## Layout Change
The chat page will be restructured into a **split layout**:
- **Left side**: The video avatar player (always visible)
- **Right side**: The chat messages and input

On mobile, the video will sit above the chat area.

## Video Segment Map

| State | Video Segment | Text Bubble |
|-------|--------------|-------------|
| Intro greeting | 10s - 15s | "Hi, I am Novate Abby. Nice to meet you. I will be your tutor for today." |
| Ask name | 15s - 19s | "Can you tell me your name and native language please?" |
| Idle / waiting | 0s - 10s (loop) | -- (no new bubble) |
| Didn't understand | 30s - 36s | "Pardon me, can you repeat that again?" |
| Understood reply | 23s - 29s | "Thank you for that. So, what do you want to practice today?" |

## Scripted Intro Flow (replaces AI-streamed intro)

1. On mount, skip the `triggerIntro()` call to the chat edge function
2. Instead, run a scripted state machine:
   - State `greeting`: Play 10s-15s, show first text bubble
   - On video segment end, transition to `ask_name`: Play 15s-19s, show second bubble
   - On segment end, transition to `idle`: Loop 0s-10s, wait for user input
   - If user responds and AI returns an error or empty response (can't understand), transition to `not_understood`: Play 30s-36s, show pardon bubble, then back to `idle`
   - If user responds and AI understands, transition to `understood`: Play 23s-29s, show thank you bubble
   - After `understood` segment ends, transition to `normal` mode where the AI chat continues as usual

## Technical Details

### New Files
1. **`src/components/VideoAvatar.tsx`** -- A React component wrapping an HTML5 `<video>` element. Props: `segment` (start/end times), `loop`, `onSegmentEnd` callback. Uses `timeupdate` events to enforce segment boundaries and loop behavior.

2. **`src/hooks/useIntroSequence.ts`** -- A state machine hook managing the intro phases (`greeting` -> `ask_name` -> `idle` -> `not_understood` / `understood` -> `normal`). Returns: current video segment config, scripted messages to display, phase state, and a handler for processing user responses.

### Modified Files
3. **`src/pages/Chat.tsx`** -- Major refactor:
   - Copy the video file to `public/videos/novate-abby.mp4`
   - Import and use `VideoAvatar` and `useIntroSequence`
   - Replace `triggerIntro()` with the scripted intro sequence
   - During intro phases, scripted messages are injected directly into the messages array (no AI call)
   - Disable TTS (`useSpeechSynthesis`) during intro phases -- video audio plays instead
   - After the intro completes (`normal` phase), resume standard AI chat flow
   - Update layout to show video alongside chat
   - Rename header from "Tom Holland" to "Novate Abby"

4. **`src/components/ChatBubble.tsx`** -- Remove the `LingbotAvatar` from assistant bubbles (avatar is now the video panel, not inline)

5. **`supabase/functions/chat/index.ts`** -- Update the system prompt: replace "Tom Holland" persona with "Novate Abby" and update the intro instruction so the AI never repeats the scripted intro

### Video Segment Player Logic
The `VideoAvatar` component will:
- Accept `startTime`, `endTime`, and `loop` props
- On mount or prop change, seek to `startTime` and play
- Listen to `timeupdate`: if `currentTime >= endTime`, either loop back to `startTime` or pause and call `onSegmentEnd`
- The video element will have `playsInline`, `autoPlay` attributes for mobile compatibility

### Intro State Machine
```text
[mount] --> GREETING (10-15s)
        --> ASK_NAME (15-19s)
        --> IDLE (0-10s loop)
        --> user responds
            |-- AI fails/empty --> NOT_UNDERSTOOD (30-36s) --> IDLE
            |-- AI succeeds    --> UNDERSTOOD (23-29s) --> NORMAL
```

During `NORMAL` mode, the video loops the idle segment (0-10s) and standard AI chat resumes with TTS re-enabled.

