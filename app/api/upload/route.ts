// File upload API
// - Accepts multipart/form-data with a `file` field
// - Only allows PDF and PPT/PPTX files
// - Stores files in the local /uploads folder and returns the stored path

import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

import { auth } from "../../../lib/auth";

const ALLOWED_TYPES = new Set<
  | "application/pdf"
  | "application/vnd.ms-powerpoint"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
>([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return new NextResponse("No file uploaded", { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type as any)) {
    return new NextResponse("Only PDF and PPT/PPTX files are allowed", {
      status: 400,
    });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const fileName = `${Date.now()}_${safeName}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.writeFile(filePath, buffer);

  // Store relative path; can be used later for download endpoints
  const storedPath = `/uploads/${fileName}`;

  return NextResponse.json({ filePath: storedPath });
}
