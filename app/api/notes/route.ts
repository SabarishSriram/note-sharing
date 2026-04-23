// Notes API
// - GET: list notes for the logged-in user (with search/filter)
// - POST: create a new note record after file upload

import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const createNoteSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  subjectCode: z.string().min(1),
  semester: z.coerce.number().int().min(1).max(12),
  filePath: z.string().min(1),
});

const updateNoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subject: z.string().min(1),
  subjectCode: z.string().min(1),
  semester: z.coerce.number().int().min(1).max(12),
});

const deleteNoteSchema = z.object({
  id: z.string().min(1),
});

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!(session?.user && (session.user as any).id)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const search = request.nextUrl.searchParams.get("search") ?? "";
  const semesterParam = request.nextUrl.searchParams.get("semester");
  const semester = semesterParam ? Number(semesterParam) : undefined;

  const userId = (session.user as any).id as string;

  let query = supabase
    .from("notes")
    .select("id, title, subject, subject_code, semester, file_path, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (search) {
    // Match search against title, subject, or subject_code (case-insensitive)
    query = query.or(`title.ilike.%${search}%,subject.ilike.%${search}%,subject_code.ilike.%${search}%`);
  }

  if (semester) {
    query = query.eq("semester", semester);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase notes GET error", error);
    return NextResponse.json(
      { error: "Could not load notes" },
      { status: 500 },
    );
  }

  const mapped = (data ?? []).map((n: any) => ({
    id: n.id,
    title: n.title,
    subject: n.subject,
    subjectCode: n.subject_code,
    semester: n.semester,
    createdAt: n.created_at,
    filePath: n.file_path,
  }));

  return NextResponse.json(mapped);
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!(session?.user && (session.user as any).id)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json();
  const parsed = createNoteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { title, subject, subjectCode, semester, filePath } = parsed.data;

  const userId = (session.user as any).id as string;

  const { data, error } = await supabase
    .from("notes")
    .insert({
      title,
      subject,
      subject_code: subjectCode,
      semester,
      file_path: filePath,
      user_id: userId,
    })
    .select("id, title, subject, subject_code, semester, file_path, created_at")
    .maybeSingle();

  if (error || !data) {
    console.error("Supabase notes POST error", error);
    return NextResponse.json(
      { error: "Could not create note" },
      { status: 500 },
    );
  }

  const mapped = {
    id: data.id,
    title: data.title,
    subject: data.subject,
    subjectCode: data.subject_code,
    semester: data.semester,
    createdAt: data.created_at,
    filePath: data.file_path,
  };

  return NextResponse.json(mapped, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!(session?.user && (session.user as any).id)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json();
  const parsed = updateNoteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id, title, subject, subjectCode, semester } = parsed.data;
  const userId = (session.user as any).id as string;

  const { data, error } = await supabase
    .from("notes")
    .update({ title, subject, subject_code: subjectCode, semester })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id, title, subject, subject_code, semester, file_path, created_at")
    .maybeSingle();

  if (error || !data) {
    console.error("Supabase notes PATCH error", error);
    return NextResponse.json(
      { error: "Could not update note" },
      { status: 500 },
    );
  }

  const mapped = {
    id: data.id,
    title: data.title,
    subject: data.subject,
    subjectCode: data.subject_code,
    semester: data.semester,
    createdAt: data.created_at,
    filePath: data.file_path,
  };

  return NextResponse.json(mapped, { status: 200 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();

  if (!(session?.user && (session.user as any).id)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const json = await request.json();
  const parsed = deleteNoteSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = parsed.data;
  const userId = (session.user as any).id as string;

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Supabase notes DELETE error", error);
    return NextResponse.json(
      { error: "Could not delete note" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
