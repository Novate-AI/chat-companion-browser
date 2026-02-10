/**
 * Parse an assistant message into main content, translation, transliteration, and suggestions.
 */
export interface ParsedMessage {
  mainContent: string;
  translation: string | null;
  transliteration: string | null;
  suggestions: string[];
}

export function parseAssistantMessage(content: string): ParsedMessage {
  let mainContent = content;
  let translation: string | null = null;
  let transliteration: string | null = null;
  const suggestions: string[] = [];

  // Extract suggestions
  const suggestionsMatch = mainContent.match(/SUGGESTIONS:\s*\n([\s\S]*?)$/i);
  if (suggestionsMatch) {
    mainContent = mainContent.slice(0, suggestionsMatch.index).trim();
    const sugLines = suggestionsMatch[1].trim().split("\n");
    for (const line of sugLines) {
      const cleaned = line.replace(/^\d+\.\s*/, "").trim();
      if (cleaned) suggestions.push(cleaned);
    }
  }

  // Also catch the old emoji format
  const oldSugMatch = mainContent.match(/💡\s*Suggestions:\s*\n([\s\S]*?)$/i);
  if (oldSugMatch) {
    mainContent = mainContent.slice(0, oldSugMatch.index).trim();
    const sugLines = oldSugMatch[1].trim().split("\n");
    for (const line of sugLines) {
      const cleaned = line.replace(/^\d+\.\s*/, "").trim();
      if (cleaned) suggestions.push(cleaned);
    }
  }

  // Extract transliteration (before translation to avoid order issues)
  const translitMatch = mainContent.match(/TRANSLITERATION:\s*([\s\S]*?)(?=TRANSLATION:|$)/i);
  if (translitMatch) {
    transliteration = translitMatch[1].trim();
    mainContent = mainContent.replace(translitMatch[0], "").trim();
  }

  // Extract translation
  const transMatch = mainContent.match(/TRANSLATION:\s*([\s\S]*?)(?=TRANSLITERATION:|$)/i);
  if (transMatch) {
    translation = transMatch[1].trim();
    mainContent = mainContent.replace(transMatch[0], "").trim();
  }

  // Also catch old format with 📝
  const oldTransMatch = mainContent.match(/📝\s*\w+:\s*([\s\S]*?)$/i);
  if (oldTransMatch && !translation) {
    translation = oldTransMatch[1].trim();
    mainContent = mainContent.slice(0, oldTransMatch.index).trim();
  }

  // Strip any leftover emojis
  mainContent = mainContent.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}]/gu, "").trim();

  return { mainContent, translation, transliteration, suggestions };
}

/**
 * Get only the speakable content (main content without translation/suggestions)
 */
export function getSpeakableText(content: string): string {
  const { mainContent } = parseAssistantMessage(content);
  return mainContent;
}
