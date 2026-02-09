

# Lingbot World — Voice Language Tutor

A browser-based app where users can have voice or text conversations with **Lingbot**, an AI language tutor character that helps them practice multiple languages.

---

## 1. Landing / Home Screen
- Display the Lingbot character (using your uploaded image) front and center
- A language selector letting users pick which language to practice (Spanish, French, Mandarin, Japanese, German, etc.)
- A "Start Conversation" button to enter the chat

## 2. Chat Interface
- **Lingbot avatar** displayed prominently at the top with a visual indicator when Lingbot is "speaking"
- **Message area** showing the conversation history (both user and Lingbot messages displayed as chat bubbles)
- **Dual input options:**
  - A **microphone button** to speak to Lingbot (speech-to-text using ElevenLabs)
  - A **text input field** to type messages instead
- Lingbot **always responds with voice** (text-to-speech using ElevenLabs) in addition to showing the text response

## 3. Lingbot AI Personality
- Lingbot acts as a friendly, encouraging language tutor
- Responds in the target language with translations/explanations when needed
- Gently corrects mistakes and suggests better phrasing
- Adapts to the user's level based on conversation context
- Powered by Lovable AI (Gemini) for intelligent language tutoring responses

## 4. Voice Features
- **Speech-to-Text**: User speaks → transcribed and sent to Lingbot (ElevenLabs Scribe)
- **Text-to-Speech**: Lingbot's responses are spoken aloud with a natural voice (ElevenLabs TTS)
- Visual feedback showing when the mic is active and when Lingbot is speaking

## 5. Tech Approach
- ElevenLabs for both speech-to-text and text-to-speech (requires connecting your ElevenLabs API key)
- Lovable AI for the language tutor intelligence (built-in, no extra setup)
- Lovable Cloud backend for secure API calls
- Clean, mobile-friendly design

