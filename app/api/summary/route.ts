// Force Node.js runtime – required for fs, createRequire, and pdf extraction.
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { extractTextFromFile } from "@/lib/extractor";
import { generateText } from "@/lib/gemini";

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
        { status: 422 }
      );
    }

    // Gemini 1.5/2.5 Flash supports ~1M token context; 100k chars ≈ safe limit
    const truncatedText = text.substring(0, 100_000);

    const prompt =
      `You are a helpful study assistant. Read the following class notes and ` +
      `provide a concise but comprehensive summary in well-structured Markdown.\n` +
      `Use ## headings for major sections, **bold** for key terms, and bullet ` +
      `points for lists. End with a "## Potential Exam Questions" section.\n\n` +
      `NOTES:\n${truncatedText}\n\nSUMMARY:`;

    const summary = await generateText(prompt);
    return NextResponse.json({ summary });
  } catch (err: unknown) {
    console.error("Summary error:", err);
    const message =
      err instanceof Error ? err.message : "Could not generate summary";
    return new NextResponse(message, { status: 500 });
  }
}
