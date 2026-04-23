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

  const { noteId } = await request.json();
  if (!noteId) {
    return new NextResponse("Missing noteId", { status: 400 });
  }

  const { data: note, error } = await supabase
    .from("notes")
    .select("file_path")
    .eq("id", noteId)
    .single();

  if (error || !note) {
    return new NextResponse("Note not found", { status: 404 });
  }

  try {
    const text = await extractTextFromFile(note.file_path);
    if (!text || !text.trim()) {
      return new NextResponse(
        "No readable text could be extracted from this file.",
        { status: 422 },
      );
    }

    // Truncate to avoid huge limits if needed, Gemini 1.5 Flash has 1M context
    // but text might be large
    const truncatedText = text.substring(0, 100000);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are a helpful study assistant. Read the following class notes and provide a concise but comprehensive summary. Highlight key definitions, concepts, and potential exam questions if applicable.\n\nNOTES:\n${truncatedText}\n\nSUMMARY:`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    return NextResponse.json({ summary });
  } catch (err: unknown) {
    console.error("Summary error:", err);
    const message =
      err instanceof Error ? err.message : "Could not generate summary";
    return new NextResponse(message, { status: 500 });
  }
}
