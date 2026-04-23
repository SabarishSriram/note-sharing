"use client";

// Client-side component that renders a list of notes
// and offers search + semester filtering on already-fetched data.

import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { subjectData } from "@/lib/subjectMapping";
import { AIModal } from "@/components/ai-modal";

export type Note = {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  semester: number;
  createdAt: string;
  filePath: string;
};

type Props = {
  initialNotes: Note[];
};

export function NotesList({ initialNotes }: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);
  const [editUnit, setEditUnit] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editSubjectCode, setEditSubjectCode] = useState("");
  const [editSemester, setEditSemester] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeAI, setActiveAI] = useState<{ mode: "summary" | "chat", note: Note } | null>(null);

  const editSemesterValue =
    editSemester || (editing ? String(editing.semester) : "");
  const subjectList = subjectData[editSemesterValue] || [];

  const filtered = useMemo(() => {
    return notes.filter((note) => {
      const matchesSearch = search
        ? note.title.toLowerCase().includes(search.toLowerCase()) ||
          note.subject.toLowerCase().includes(search.toLowerCase()) ||
          note.subjectCode?.toLowerCase().includes(search.toLowerCase())
        : true;

      const matchesSemester = semester
        ? note.semester === Number(semester)
        : true;
      const matchesSubject = subjectFilter
        ? note.subjectCode === subjectFilter
        : true;

      return matchesSearch && matchesSemester && matchesSubject;
    });
  }, [notes, search, semester, subjectFilter]);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this note?",
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
      window.alert("Could not delete note. Please try again.");
    }
  };

  const openEdit = (note: Note) => {
    setEditing(note);
    setEditUnit(note.title);
    setEditSubject(note.subject);
    setEditSubjectCode(note.subjectCode);
    setEditSemester(String(note.semester));
    setMenuOpenId(null);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          title: editUnit,
          subject: editSubject,
          subjectCode: editSubjectCode,
          semester: Number(editSemester || editing.semester),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update note");
      }

      const updated: Note = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setEditing(null);
    } catch (err) {
      console.error(err);
      window.alert("Could not update note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-sm font-medium text-slate-800">Search</label>
          <Input
            placeholder="Search by title or subject"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-40 space-y-1">
          <label className="text-sm font-medium text-slate-800">Semester</label>
          <Select
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value);
              setSubjectFilter("");
            }}
          >
            <option value="">All</option>
            {Array.from({ length: 8 }).map((_, idx) => (
              <option key={idx + 1} value={idx + 1}>{`Semester ${
                idx + 1
              }`}</option>
            ))}
          </Select>
        </div>

        <div className="w-64 space-y-1">
          <label className="text-sm font-medium text-slate-800">Subject</label>
          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            disabled={!semester}
          >
            <option value="">All Subjects</option>
            {semester &&
              (subjectData[semester] || []).map((subj) => (
                <option key={subj.code} value={subj.code}>
                  {subj.code} - {subj.name}
                </option>
              ))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-slate-500">
          No notes found yet. Try adjusting your filters or upload a new note.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((note) => (
            <Card
              key={note.id}
              className="relative flex h-full cursor-pointer flex-col justify-between border-slate-200/90 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#0C4B9C]/50 hover:shadow-lg"
              onClick={() => {
                if (note.filePath) {
                  window.open(note.filePath, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId((prev) => (prev === note.id ? null : note.id));
                }}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#0C4B9C] bg-white text-[#0C4B9C] shadow-sm hover:bg-[#0C4B9C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0C4B9C] focus-visible:ring-offset-2"
                aria-label="Open note menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <circle cx="5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>

              <CardHeader className="space-y-2">
                <div className="space-y-1">
                  <CardTitle className="line-clamp-2 text-base font-semibold text-slate-900">
                    {note.title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs font-medium text-[#0C4B9C]">
                    [{note.subjectCode}] {note.subject}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                    Semester {note.semester}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(note.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </CardContent>

              {menuOpenId === note.id && (
                <div className="absolute right-3 top-10 z-10 w-32 rounded-md border border-slate-200 bg-white py-1 text-xs shadow-lg">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(note);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M15.232 5.232 18.768 8.768" />
                      <path d="M4 20h4l9.5-9.5a1.5 1.5 0 0 0-4-4L4 16v4z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[#0C4B9C] hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAI({ mode: "summary", note });
                      setMenuOpenId(null);
                    }}
                  >
                    <span>✨ Summarize</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[#0C4B9C] hover:bg-slate-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveAI({ mode: "chat", note });
                      setMenuOpenId(null);
                    }}
                  >
                    <span>💬 Chat AI</span>
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId(null);
                      handleDelete(note.id);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                    >
                      <path d="M9 3h6" />
                      <path d="M4 7h16" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Edit note</h2>
            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Semester
                </label>
                <Select
                  value={editSemesterValue}
                  onChange={(e) => setEditSemester(e.target.value)}
                >
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <option key={idx + 1} value={idx + 1}>{`Semester ${
                      idx + 1
                    }`}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Unit
                </label>
                <Select
                  value={editUnit}
                  onChange={(e) => setEditUnit(e.target.value)}
                >
                  <option value="Unit 1">Unit 1</option>
                  <option value="Unit 2">Unit 2</option>
                  <option value="Unit 3">Unit 3</option>
                  <option value="Unit 4">Unit 4</option>
                  <option value="Unit 5">Unit 5</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-800">
                  Subject & Code
                </label>
                <Select
                  value={editSubjectCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setEditSubjectCode(code);
                    const subj = subjectList.find(s => s.code === code);
                    setEditSubject(subj ? subj.name : "");
                  }}
                >
                  <option value="">Select subject</option>
                  {subjectList.map((subj) => (
                    <option key={subj.code} value={subj.code}>
                      {subj.code} - {subj.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3 text-sm">
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100"
                onClick={() => setEditing(null)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-[#0C4B9C] px-3 py-1.5 font-medium text-white hover:bg-[#0a3d7c] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleEditSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeAI && (
        <AIModal 
          mode={activeAI.mode} 
          note={activeAI.note} 
          onClose={() => setActiveAI(null)} 
        />
      )}
    </div>
  );
}
