// Upload page
// Protected route that shows the upload form for notes.

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { UploadForm } from "@/components/upload-form";

export default async function UploadPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login?error=Please+log+in");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Upload Notes
      </h1>

      <div className="flex justify-center">
        <UploadForm />
      </div>
    </div>
  );
}
