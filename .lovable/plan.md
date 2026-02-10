

# Lingbot World — Implementation Plan

## Overview
Build a browser-based language tutor app where users chat (text or voice) with "Lingbot," a friendly AI language tutor. Uses the uploaded teacher image as the Lingbot character, browser-native Web Speech API for voice, and Lovable AI for tutoring intelligence.

## What Gets Built

### 1. Landing Page (Home Screen)
- Lingbot character image displayed prominently
- Language selector dropdown (Spanish, French, Mandarin, Japanese, German, Italian, Portuguese, Korean)
- "Start Conversation" button
- Clean, welcoming design with a language-learning theme

### 2. Chat Page
- Lingbot avatar at the top with a "speaking" animation indicator
- Scrollable message area with chat bubbles (user on right, Lingbot on left)
- Text input field with send button
- Microphone button for voice input (uses browser SpeechRecognition API)
- Lingbot speaks responses aloud (uses browser SpeechSynthesis API)
- Visual indicators for mic active and Lingbot speaking states

### 3. AI Tutoring (via Lovable Cloud)
- An edge function that receives user messages and the selected language
- System prompt configuring Lingbot as a friendly language tutor that:
  - Responds primarily in the target language
  - Provides translations in parentheses for beginners
  - Corrects mistakes gently
  - Adapts difficulty based on conversation
- Powered by Lovable AI (Gemini) — no extra API keys

### 4. Voice Features (Browser Native)
- Speech-to-Text: Web SpeechRecognition API — user clicks mic, speaks, text appears
- Text-to-Speech: Web SpeechSynthesis API — Lingbot's responses are read aloud using the language-appropriate voice
- No external services or API keys required
- Note: Works best in Chrome/Edge; limited support in some browsers

## Technical Details

### New Files to Create
- `src/pages/Chat.tsx` — Chat interface page
- `src/components/LingbotAvatar.tsx` — Lingbot character display with speaking indicator
- `src/components/ChatBubble.tsx` — Message bubble component
- `src/components/ChatInput.tsx` — Text input + mic button
- `src/components/LanguageSelector.tsx` — Language picker component
- `src/hooks/useSpeechRecognition.ts` — Hook wrapping browser SpeechRecognition
- `src/hooks/useSpeechSynthesis.ts` — Hook wrapping browser SpeechSynthesis
- `src/lib/languages.ts` — Language list and config (names, codes, voice tags)

### Files to Modify
- `src/pages/Index.tsx` — Replace with Lingbot landing page
- `src/App.tsx` — Add /chat route
- `index.html` — Update title to "Lingbot World"
- `src/index.css` — Add custom colors for a friendly language-learning theme

### Backend (Lovable Cloud)
- Enable Lovable Cloud
- Create an edge function `chat` that:
  - Receives `{ message, language, conversationHistory }`
  - Calls Lovable AI with a language-tutor system prompt
  - Returns the AI response text

### Asset
- Copy uploaded teacher image to `src/assets/lingbot.png`

## Limitations to Be Aware Of
- Browser Speech APIs have varying support — Chrome/Edge work best, Safari and Firefox have partial support
- Voice quality is basic compared to ElevenLabs but perfectly functional
- Speech recognition accuracy varies by language and browser

