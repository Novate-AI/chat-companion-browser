import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const transcript = messages.map((m: { role: string; content: string }) =>
      `${m.role === "user" ? "Candidate" : "Examiner"}: ${m.content}`
    ).join("\n\n");

    const systemPrompt = `You are an expert IELTS Speaking examiner and assessor. Analyze the following IELTS Speaking test transcript and produce a detailed band score report. Do NOT use emojis. Use plain text only.

Format the report EXACTLY as follows:

IELTS SPEAKING TEST REPORT
============================

Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

OVERALL BAND SCORE: [X.0 or X.5, from 1-9]

CRITERION SCORES
------------------

Fluency and Coherence: [Band 1-9]
[2-3 sentences explaining the score. Comment on speech rate, hesitation, use of discourse markers, coherence of ideas.]

Lexical Resource: [Band 1-9]
[2-3 sentences explaining the score. Comment on vocabulary range, precision, idiomatic language, paraphrasing ability.]

Grammatical Range and Accuracy: [Band 1-9]
[2-3 sentences explaining the score. Comment on sentence structures, tense usage, error frequency, complexity.]

Pronunciation: [Band 1-9]
[2-3 sentences explaining the score. Comment on clarity, intonation, stress patterns, intelligibility.]

PERFORMANCE SUMMARY
---------------------
[3-4 sentences summarizing overall performance across all three parts of the test.]

STRENGTHS
----------
[List 3-4 specific things the candidate did well, with examples from the transcript.]

AREAS FOR IMPROVEMENT
-----------------------
[List 3-4 specific areas to improve, with concrete examples from the transcript.]

RECOMMENDATIONS
-----------------
[Provide 4-5 actionable recommendations for improving the candidate's IELTS Speaking score, including specific practice exercises.]

Note: Base your assessment strictly on the IELTS Speaking Band Descriptors. Be fair but honest. If the candidate gave very short answers or didn't speak much, reflect that in the scores.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is the IELTS Speaking test transcript:\n\n${transcript}` },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Failed to generate feedback" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content || "Could not generate feedback.";

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ielts-feedback error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
