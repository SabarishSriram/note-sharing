export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { extractTextFromFile } from "@/lib/extractor";
import { generateText } from "@/lib/gemini";

const genAI_instance = null; // kept for compatibility – we use lib/gemini now

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { messages, noteId } = await request.json();
  if (!messages || !Array.isArray(messages)) {
    return new NextResponse("Missing messages array", { status: 400 });
  }

  let noteContext = "";
  if (noteId) {
    const { data: note } = await supabase
      .from("notes")
      .select("file_path, title")
      .eq("id", noteId)
      .single();

    if (note) {
      try {
        const text = await extractTextFromFile(note.file_path);
        if (text && text.trim()) {
          noteContext =
            `Context from the currently selected note ("${note.title}"):\n` +
            `${text.substring(0, 50_000)}\n\n`;
        }
      } catch (err) {
        console.error("Failed to extract note text for chat:", err);
      }
    }
  }

  try {
    const history = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "AI"}: ${m.content}`
      )
      .join("\n");

    const prompt =
      (noteContext
        ? noteContext +
          "Please answer the user's questions primarily based on the above " +
          "context if applicable. Format your answer using Markdown: use " +
          "**bold** for key terms, bullet points for lists, and `code` for " +
          "technical terms. Keep answers concise.\n\n"
        : "") +
      `Conversation:\n${history}\nAI:`;

    const text = await generateText(prompt);
    return NextResponse.json({ text });
  } catch (err: unknown) {
    console.error("Chat error:", err);
    const message =
      err instanceof Error ? err.message : "Could not generate response";
    return new NextResponse(message, { status: 500 });
  }
}
