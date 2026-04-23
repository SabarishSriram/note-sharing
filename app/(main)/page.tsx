import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
        Welcome to SRM Note Share
      </h1>
      <p className="text-slate-700">
        A simple note sharing platform for SRM students. Upload your lecture
        notes as PDF or PPT, filter by semester, and quickly find what you need
        before exams.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-md bg-[#0C4B9C] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#0a3d7c]"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center text-white/80">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
              <path
                d="M4 4h7v7H4V4zm9 0h7v4h-7V4zM4 13h5v7H4v-7zm9-3h7v10h-7V10z"
                fill="currentColor"
              />
            </svg>
          </span>
          Go to Dashboard
        </Link>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <span className="inline-flex h-4 w-4 items-center justify-center text-slate-500">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
              <path
                d="M5 20h14v-2H5v2zm7-16l-5 5h3v4h4v-4h3l-5-5z"
                fill="currentColor"
              />
            </svg>
          </span>
          Upload Notes
        </Link>
      </div>
      <p className="text-xs text-slate-500">
        AI chat will live in the sidebar soon – the layout already reserves a
        space for it.
      </p>
    </div>
  );
}
