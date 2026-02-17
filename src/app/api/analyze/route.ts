import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();
    
    if (!content || content.trim().length < 10) {
      return NextResponse.json(
        { error: "Content too short" },
        { status: 400 }
      );
    }

    const minimaxApiKey = process.env.MINIMAX_API_KEY;
    
    if (!minimaxApiKey) {
      // Return mock data if no API key
      return NextResponse.json({
        summary: "This is a brainstorming session with multiple ideas and notes. The content covers various topics that could be organized into actionable items.",
        actionItems: [
          "Review and prioritize the ideas mentioned",
          "Schedule time to work on top priorities",
          "Follow up on any outstanding items"
        ],
        tags: ["brainstorm", "ideas", "notes"]
      });
    }

    const response = await fetch("https://api.minimax.chat/v1/text/chatcompletion_pro", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${minimaxApiKey}`
      },
      body: JSON.stringify({
        model: "abab6.5s-chat",
        messages: [
          {
            role: "system",
            content: `You are a helpful assistant that organizes brain dumps. Analyze the user's content and provide:
1. A brief summary (1-2 sentences)
2. Actionable items as a JSON array (max 5 items)
3. Relevant tags as a JSON array (max 5 tags)

Respond ONLY with valid JSON in this exact format:
{"summary": "...", "actionItems": ["...", "..."], "tags": ["...", "..."]}`
          },
          {
            role: "user",
            content: content
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("MiniMax API error");
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("AI analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
