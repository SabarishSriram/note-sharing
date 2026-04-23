"use client";

// Client-side form for uploading notes
// - Validates basic fields with Zod
// - Uploads file to /api/upload, then creates note via /api/notes

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { subjectData } from "@/lib/subjectMapping";

const uploadSchema = z.object({
  title: z.string().min(1, "Unit is required"),
  subject: z.string().min(1, "Subject error"),
  subjectCode: z.string().min(1, "Subject Code is required"),
  semester: z.string().min(1, "Semester is required"),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function UploadForm() {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { semester: "1", subjectCode: "" },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onSubmit = async (values: UploadFormValues) => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const fileEl = fileInputRef.current;
      const file = fileEl?.files?.[0];

      if (!file) {
        setError("Please choose a PDF or PPT/PPTX file to upload.");
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.text();
        throw new Error(data || "File upload failed");
      }

      const { filePath } = await uploadRes.json();

      const createRes = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          semester: Number(values.semester),
          filePath,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => null);
        throw new Error(data?.error || "Could not save note");
      }

      setSuccess("Note uploaded successfully.");
      reset({ title: "", subject: "", subjectCode: "", semester: values.semester });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSemester = watch("semester") || "1";
  const subjectList = subjectData[selectedSemester] || [];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-xl space-y-5 rounded-2xl border border-slate-200 bg-white/90 p-8 shadow-lg backdrop-blur"
    >
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">Upload Notes</h2>
        <p className="text-sm text-slate-600">
          Share your lecture PDFs or PPTs with your classmates. Once uploaded,
          your notes will appear on the dashboard where you can search and
          filter them by subject and semester.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500">
          <li>Supported formats: PDF, PPT, PPTX</li>
          <li>
            Keep file names short and meaningful (e.g., "DBMS_Unit_2.pdf").
          </li>
          <li>You can preview any uploaded note from the Dashboard.</li>
        </ul>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800">Semester</label>
        <Select
          {...register("semester", {
            onChange: () => {
              setValue("subjectCode", ""); // Reset subject code when semester changes
              setValue("subject", "");
            },
          })}
        >
          {Array.from({ length: 8 }).map((_, idx) => (
            <option key={idx + 1} value={idx + 1}>{`Semester ${
              idx + 1
            }`}</option>
          ))}
        </Select>
        {errors.semester && (
          <p className="text-xs text-red-600">{errors.semester.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800">Subject Code & Name</label>
        <Select
          {...register("subjectCode", {
            onChange: (e) => {
              const code = e.target.value;
              const subj = subjectList.find((s) => s.code === code);
              if (subj) {
                setValue("subject", subj.name);
              } else {
                setValue("subject", "");
              }
            },
          })}
        >
          <option value="">Select Subject</option>
          {subjectList.map((subj) => (
            <option key={subj.code} value={subj.code}>
              {subj.code} - {subj.name}
            </option>
          ))}
        </Select>
        {errors.subjectCode && (
           <p className="text-xs text-red-600">{errors.subjectCode.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800">Unit</label>
        <Select {...register("title")}>
          <option value="">Select unit</option>
          <option value="Unit 1">Unit 1</option>
          <option value="Unit 2">Unit 2</option>
          <option value="Unit 3">Unit 3</option>
          <option value="Unit 4">Unit 4</option>
          <option value="Unit 5">Unit 5</option>
        </Select>
        {errors.title && (
          <p className="text-xs text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-800">File</label>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-[#0C4B9C] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#0a3d7c]"
        />
        <p className="text-xs text-slate-500">PDF, PPT, or PPTX only.</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Button
        type="submit"
        className="mt-2 flex w-full justify-center"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Uploading..." : "Upload"}
      </Button>
    </form>
  );
}
