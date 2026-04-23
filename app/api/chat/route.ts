import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { extractTextFromFile } from "@/lib/extractor";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
          noteContext = `Context from currently selected note ("${note.title}"):\n${text.substring(0, 50000)}\n\n`;
        }
      } catch (err) {
        console.error("Failed to extract note text for chat", err);
      }
    }
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Convert conversational format
    const prompt = `${noteContext ? noteContext + "Please answer the user's questions primarily based on the above context if applicable.\n\n" : ""}Conversational History:\n${messages.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n")}\nAI:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (err: unknown) {
    console.error("Chat error:", err);
    const message =
      err instanceof Error ? err.message : "Could not generate response";
    return new NextResponse(message, { status: 500 });
  }
}
