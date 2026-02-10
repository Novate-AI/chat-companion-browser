import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Question Bank ──────────────────────────────────────────────────────

const part1Themes: Record<string, string[]> = {
  "Home & Accommodation": [
    "Do you live in a house or an apartment?",
    "What is your favourite room in your home?",
    "How long have you lived there?",
    "What do you like most about your home?",
    "Is there anything you would like to change about your home?",
    "Do you plan to live there for a long time?",
    "What kind of housing is most popular in your city?",
    "Who do you live with?",
    "Do you have a garden?",
    "What can you see from the windows of your home?",
    "Is your neighbourhood a good place to live?",
    "What is the transport like near your home?",
  ],
  "Work & Studies": [
    "Do you work or are you a student?",
    "What do you do for work?",
    "Why did you choose that job?",
    "What do you like most about your job?",
    "Is there anything you dislike about your work?",
    "What are your future career plans?",
    "Do you prefer working alone or in a team?",
    "What subject are you studying?",
    "Why did you choose that subject?",
    "What do you enjoy most about your studies?",
    "Do you prefer studying in the morning or evening?",
    "Would you like to change your job in the future?",
  ],
  "Hobbies & Free Time": [
    "What do you enjoy doing in your free time?",
    "How often do you do that activity?",
    "Did you enjoy the same hobbies when you were younger?",
    "Do you prefer indoor or outdoor activities?",
    "Is there a new hobby you would like to try?",
    "Do you think hobbies are important?",
    "How much free time do you usually have?",
    "Do you prefer spending your free time alone or with others?",
    "What is the most popular hobby in your country?",
    "Have you ever taught someone one of your hobbies?",
    "Do you think people have enough free time these days?",
    "Would you like more free time?",
  ],
  "Daily Routine": [
    "What is a typical day like for you?",
    "What do you usually do in the mornings?",
    "Do you have the same routine every day?",
    "What is your favourite part of the day?",
    "Are you a morning person or a night person?",
    "Has your daily routine changed much over the years?",
    "What do you usually do on weekends?",
    "Do you think routines are important?",
    "What would you change about your daily routine?",
    "Do you usually eat breakfast?",
    "How do you usually get to work or school?",
    "What do you do to relax at the end of the day?",
  ],
  "Food & Cooking": [
    "What kind of food do you like to eat?",
    "Do you enjoy cooking?",
    "What is your favourite meal of the day?",
    "Do you prefer eating at home or in restaurants?",
    "What is a popular dish in your country?",
    "Have you ever tried food from another country?",
    "Do you think your diet is healthy?",
    "What food did you enjoy as a child?",
    "Can you cook well?",
    "How often do you eat out?",
    "Do you think it is important to eat together as a family?",
    "Is there any food you do not like?",
  ],
  "Weather & Seasons": [
    "What is the weather like in your country?",
    "Which season do you like best?",
    "Does the weather affect your mood?",
    "What do you usually do when it rains?",
    "Do you prefer hot or cold weather?",
    "Has the weather in your country changed over the years?",
    "What is your favourite kind of weather?",
    "Do you check the weather forecast regularly?",
    "What clothes do you wear in different seasons?",
    "Do you enjoy spending time outdoors?",
    "How does the weather affect daily life in your country?",
    "Would you like to live in a country with a different climate?",
  ],
  "Transport & Travel": [
    "How do you usually travel to work or school?",
    "Do you prefer public transport or driving?",
    "What is the transport system like in your city?",
    "Do you like travelling?",
    "What is the longest journey you have taken?",
    "Do you prefer travelling by train or by plane?",
    "Is traffic a problem in your city?",
    "Do you think public transport should be free?",
    "Have you ever been on a long road trip?",
    "Do you enjoy walking?",
    "Would you like to travel more?",
    "What is the best way to get around your city?",
  ],
  "Technology & Internet": [
    "How often do you use the internet?",
    "What do you usually use the internet for?",
    "Do you think technology has improved our lives?",
    "What was the last app you downloaded?",
    "Do you prefer reading on paper or on a screen?",
    "How much time do you spend on your phone each day?",
    "Do you think children should use technology?",
    "What is the most useful piece of technology you own?",
    "How has technology changed since you were young?",
    "Do you shop online often?",
    "Do you think people spend too much time on social media?",
    "Would you like to learn more about technology?",
  ],
};

interface Part2Topic {
  topic: string;
  points: string[];
  part3Questions: string[];
}

const part2Topics: Part2Topic[] = [
  {
    topic: "Describe a place you have visited that you particularly liked.",
    points: [
      "Where the place is",
      "When you went there",
      "What you did there",
      "And explain why you particularly liked this place",
    ],
    part3Questions: [
      "What makes a tourist destination popular?",
      "Do you think tourism is good for local communities?",
      "How has travel changed over the past few decades?",
      "Do you think people travel too much these days?",
      "What are the environmental effects of tourism?",
      "Should governments do more to protect tourist sites?",
    ],
  },
  {
    topic: "Describe a person who has had an important influence on your life.",
    points: [
      "Who this person is",
      "How you know this person",
      "What this person has done to influence your life",
      "And explain why they had such an important influence",
    ],
    part3Questions: [
      "What qualities make a good role model?",
      "Do you think famous people are good role models for young people?",
      "How do parents influence their children?",
      "Is it better to be influenced by people you know or by public figures?",
      "Do you think teachers have a big influence on students?",
      "How has the role of family changed in modern society?",
    ],
  },
  {
    topic: "Describe a skill you would like to learn.",
    points: [
      "What the skill is",
      "Why you want to learn it",
      "How you would learn it",
      "And explain how this skill would help you",
    ],
    part3Questions: [
      "What skills are most important in the modern workplace?",
      "Do you think schools teach enough practical skills?",
      "Is it better to learn skills at school or through experience?",
      "How has technology changed the skills people need?",
      "Do you think everyone should learn a second language?",
      "Are soft skills more important than technical skills?",
    ],
  },
  {
    topic: "Describe a memorable event in your life.",
    points: [
      "What the event was",
      "When and where it happened",
      "Who was involved",
      "And explain why it was memorable for you",
    ],
    part3Questions: [
      "Why do people like to celebrate special events?",
      "Do you think we spend too much money on celebrations?",
      "How do celebrations differ between cultures?",
      "Are traditional celebrations important in modern society?",
      "How has social media changed the way people celebrate?",
      "Do people value experiences more than material things today?",
    ],
  },
  {
    topic: "Describe an important decision you had to make.",
    points: [
      "What the decision was",
      "When you made this decision",
      "How you made the decision",
      "And explain why it was important",
    ],
    part3Questions: [
      "Do you think young people make good decisions?",
      "How do people make important life decisions?",
      "Should parents make decisions for their children?",
      "Do you think people rely too much on others when making decisions?",
      "How has access to information changed decision making?",
      "Is it better to make decisions quickly or take your time?",
    ],
  },
  {
    topic: "Describe a book or film that made a strong impression on you.",
    points: [
      "What the book or film was",
      "When you read or watched it",
      "What it was about",
      "And explain why it made such an impression on you",
    ],
    part3Questions: [
      "Do you think reading is still important in the digital age?",
      "How do films influence people's views and opinions?",
      "Should schools encourage students to read more?",
      "Do you think people prefer watching films to reading books?",
      "How has the film industry changed over the years?",
      "Do books and films reflect the values of a society?",
    ],
  },
];

// ── System prompt builder ──────────────────────────────────────────────

function buildSystemPrompt(phase: string, questionIndex: number, selectedTheme: string, selectedPart2Index: number): string {
  const part2 = part2Topics[selectedPart2Index] || part2Topics[0];

  return `You are Tom, an IELTS speaking test examiner. You are conducting a real IELTS speaking test practice session. Follow these rules strictly:

1. Stay completely in character as examiner Tom at all times.
2. Keep your responses SHORT and examiner-like. Do not teach, explain, or correct during the test.
3. Do not use emojis, markdown formatting, bold text, bullet points, or numbered lists.
4. Speak in a natural, professional, British English tone.
5. NEVER deviate from the test format. Only say what an examiner would say.
6. Do NOT comment on or evaluate the candidate's answers during the test.
7. Move through the test phases as instructed by the phase parameter.

Current phase: ${phase}
Current question index: ${questionIndex}

PHASE INSTRUCTIONS:

If phase is "INTRO": Say exactly: "We are going to start IELTS speaking test practice. Are you ready?"

If phase is "ASK_NAME": Say exactly: "Ready, hello my name is Tom, can you tell me your full name please?"

If phase is "ASK_NICKNAME_ORIGIN": Say exactly: "And what shall I call you and can you tell me where you're from?"

If phase is "ASK_ID": Say exactly: "May I see your identification please?"

If phase is "ID_PAUSE": Say exactly: "Thank you, that's fine."

If phase is "PART1_INTRO": Say exactly: "We will start with Part 1 of the IELTS speaking test. In this part of the test I'm going to ask you about 12 or so questions on day-to-day topics. They should be simple and familiar questions to you."

If phase is "PART1_QUESTION": Ask the following Part 1 question for theme "${selectedTheme}". Question number ${questionIndex + 1}: "${part1Themes[selectedTheme]?.[questionIndex] || "Tell me more about that."}"
Just ask the question directly, nothing else.

If phase is "PART2_INTRO": Say: "Now I'm going to give you a topic and I'd like you to talk about it for one to two minutes. Before you talk, you'll have one minute to think about what you're going to say. Here is your topic: ${part2.topic} You should say: ${part2.points.join(", ")}."

If phase is "PART2_FOLLOWUP": After the candidate finishes speaking, you may ask ONE brief follow-up question related to their Part 2 topic. Keep it short.

If phase is "PART3_INTRO": Say exactly: "We'll now move on to Part 3. In this part of the test I'm going to ask you some more questions related to the topic in Part 2."

If phase is "PART3_QUESTION": Ask the following Part 3 question: "${part2.part3Questions[questionIndex] || "Can you tell me more about that?"}"
Just ask the question directly, nothing else.

If phase is "CONCLUSION": Say exactly: "That is the end of the speaking test. Thank you very much."

IMPORTANT: Only output the examiner's line for the current phase. Do not output anything extra.`;
}

// ── Handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, phase, questionIndex, selectedTheme, selectedPart2Index } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = buildSystemPrompt(
      phase || "INTRO",
      questionIndex || 0,
      selectedTheme || "Home & Accommodation",
      selectedPart2Index ?? 0,
    );

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...(messages || [])],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ielts-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
