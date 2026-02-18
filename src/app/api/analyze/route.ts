import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a helpful assistant that organizes brain dumps. Analyze the user's content and provide:
1. A brief summary (1-2 sentences)
2. Actionable items as a JSON array (max 5 items)
3. Relevant tags as a JSON array (max 5 tags)

Respond ONLY with valid JSON in this exact format:
{"summary": "...", "actionItems": ["...", "..."], "tags": ["...", "..."]}`;

function parseResult(raw: string) {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```/, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned);
}

async function runOpenAI(content: string, apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return parseResult(data.choices?.[0]?.message?.content || "{}");
}

async function runMiniMax(content: string, apiKey: string) {
  const response = await fetch("https://api.minimax.chat/v1/text/chatcompletion_pro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.MINIMAX_MODEL || "abab6.5s-chat",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`MiniMax API error: ${response.status}`);
  }

  const data = await response.json();
  return parseResult(data.choices?.[0]?.message?.content || "{}");
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || content.trim().length < 10) {
      return NextResponse.json({ error: "Content too short" }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const minimaxApiKey = process.env.MINIMAX_API_KEY;

    // Prefer cheaper default model if OpenAI key is available.
    if (openaiApiKey) {
      const result = await runOpenAI(content, openaiApiKey);
      return NextResponse.json(result);
    }

    if (minimaxApiKey) {
      const result = await runMiniMax(content, minimaxApiKey);
      return NextResponse.json(result);
    }

    // Mock fallback keeps UX usable with no API key configured.
    return NextResponse.json({
      summary: "You captured several thoughts that can be grouped into priorities and next steps.",
      actionItems: [
        "Pick top 1-2 priorities from this dump",
        "Schedule focused time for the top priority",
        "Convert vague ideas into concrete next actions",
      ],
      tags: ["planning", "ideas", "next-steps"],
      provider: "mock",
    });
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
