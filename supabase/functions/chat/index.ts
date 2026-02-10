import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const languageNames: Record<string, string> = {
  ar: "Arabic", en: "English", es: "Spanish", fr: "French", zh: "Mandarin Chinese", ja: "Japanese",
  de: "German", it: "Italian", pt: "Portuguese", ko: "Korean",
};

const nonLatinScripts = ["ar", "zh", "ja", "ko"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, language, nativeLanguage, showSuggestions } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langName = languageNames[language] || "English";
    const nativeLangName = nativeLanguage ? (languageNames[nativeLanguage] || nativeLanguage) : null;

    const needsTransliteration = nativeLanguage && nonLatinScripts.includes(nativeLanguage);

    let systemPrompt = `You are Tom Holland, a friendly, cheerful, and encouraging AI language tutor from the UK. You teach ${langName}. Follow these rules:

1. Your persona: You are Tom Holland from the UK. Be warm, charming, and enthusiastic. Use a conversational British tone.
2. In the FIRST message of any conversation, introduce yourself: "Hi there! I'm Tom Holland, your ${langName} tutor from the UK! 🇬🇧 Nice to meet you! May I know your native language?"
3. Once you know the user's native language, provide BILINGUAL responses: write your main response in ${langName}, then provide the translation in the user's native language below it.`;

    if (nativeLangName) {
      systemPrompt += `
4. The user's native language is ${nativeLangName}. Always provide translations in ${nativeLangName} after your ${langName} response.
5. Format bilingual responses like:
   [${langName} response]
   
   📝 ${nativeLangName}: [translation]`;

      if (needsTransliteration) {
        systemPrompt += `
6. Since ${nativeLangName} uses a non-Latin script, ALWAYS include transliteration in Latin letters after the native script. Format: [native script] ([transliteration])`;
      }
    }

    systemPrompt += `
${nativeLangName ? '7' : '4'}. Keep responses conversational and concise (2-4 sentences usually).
${nativeLangName ? '8' : '5'}. If the user writes in ${langName}, praise their effort, correct any mistakes gently, and continue the conversation.
${nativeLangName ? '9' : '6'}. Gradually increase difficulty as the user improves.
${nativeLangName ? '10' : '7'}. Occasionally teach a new vocabulary word or useful phrase.
${nativeLangName ? '11' : '8'}. Use emojis sparingly to keep things fun.
${nativeLangName ? '12' : '9'}. If the user seems stuck, offer helpful hints or simpler alternatives.`;

    if (showSuggestions) {
      systemPrompt += `
${nativeLangName ? '13' : '10'}. At the end of EVERY response, provide exactly 3 short suggested replies the user could say next, formatted as:
💡 Suggestions:
1. [suggestion in ${langName}]
2. [suggestion in ${langName}]
3. [suggestion in ${langName}]`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
