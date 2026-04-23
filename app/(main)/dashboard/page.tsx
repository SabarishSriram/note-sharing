// Dashboard page
// Protected route: only logged-in SRM users can access it.
// Shows a grid of notes with client-side filters.

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NotesList } from "@/components/dashboard/notes-list";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login?error=Please+log+in");
  }

  if (!(session.user && (session.user as any).id)) {
    redirect("/login?error=Account+not+found");
  }

  const userId = (session.user as any).id as string;

  const { data, error } = await supabase
    .from("notes")
    .select("id, title, subject, semester, file_path, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase dashboard notes error", error);
    redirect("/login?error=Could+not+load+notes");
  }

  const notes = (data ?? []).map((n) => ({
    id: n.id,
    title: n.title,
    subject: n.subject,
    semester: n.semester,
    createdAt: n.created_at,
    filePath: n.file_path,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Dashboard
      </h1>

      <NotesList initialNotes={notes} />
    </div>
  );
}
