

# Fix: AI Text Being Overwritten by Next Response

## Root Cause

The `processStream` function uses a flawed heuristic to update streaming messages: it checks if the last message is from the "assistant" and overwrites it. This means if two AI responses stream in quick succession (which happens during intro phases), the second response **replaces the text** of the first one.

The audio from the first response still plays because it was already queued in the TTS system before being overwritten.

## Timeline of the Bug

1. ASK_NAME triggers, AI streams "Hello my name is Tom..." -- text appears, audio queued
2. Stream finishes, `isLoading` goes false
3. Mic-off fallback or another trigger fires ASK_NICKNAME_ORIGIN
4. New stream starts -- `processStream` sees last message is "assistant" and **overwrites** the "My name is Tom" text with "And what shall I call you..."

## Fix

### Change 1: Track message ownership in `processStream` (`src/pages/IeltsChat.tsx`)

Instead of blindly checking if the last message is "assistant", use a local flag to track whether THIS stream has already created its message. This prevents one stream from overwriting another stream's message.

```
processStream logic change:
- Add local boolean: messageCreated = false
- On first content chunk: ALWAYS append a new assistant message, set messageCreated = true
- On subsequent chunks: find and update only the message created by this stream (use the message index captured when it was created)
```

Specifically, track the index of the message this stream created:

```typescript
let myMessageIndex = -1;

setMessages((prev) => {
  if (myMessageIndex === -1) {
    // First chunk: always create a new message
    myMessageIndex = prev.length;
    return [...prev, { role: "assistant", content: snapshot }];
  }
  // Subsequent chunks: update only our message by index
  return prev.map((m, i) => (i === myMessageIndex ? { ...m, content: snapshot } : m));
});
```

### Change 2: Add guard to mic-off fallback (`src/pages/IeltsChat.tsx`)

Add an additional check: only auto-advance if `isSpeaking` is also false (meaning the AI has finished speaking the current response). This prevents the fallback from firing while audio is still playing.

```typescript
// Line 125: add !isSpeaking check
if (wasListeningRef.current && !isListening && !isLoading && !isSpeaking) {
```

## Files Changed

- `src/pages/IeltsChat.tsx` -- two targeted edits

## Result

- Each AI response gets its own chat bubble that cannot be overwritten by the next response
- Mic-off fallback waits for audio to finish before auto-advancing
- Audio and text will always match

