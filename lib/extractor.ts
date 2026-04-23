import fs from "fs/promises";
import path from "path";
import { extractText } from "unpdf";
import officeParser from "officeparser";

type ExtractedPdfPayload = {
  text?: string;
  textItems?: string[];
};

function normalizePdfText(data: unknown): string {
  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object" && data !== null) {
    const payload = data as ExtractedPdfPayload;
    if (typeof payload.text === "string" && payload.text.trim()) {
      return payload.text;
    }
    if (Array.isArray(payload.textItems)) {
      return payload.textItems.join(" ");
    }
  }

  return String(data ?? "");
}

export async function extractTextFromFile(filePath: string): Promise<string> {
  const normalizedPath = filePath.replace(/^[\\/]+/, "");
  const absolutePath = path.resolve(process.cwd(), normalizedPath);

  const ext = path.extname(absolutePath).toLowerCase();

  if (ext === ".pdf") {
    try {
      const dataBuffer = await fs.readFile(absolutePath);
      const data = await extractText(new Uint8Array(dataBuffer));
      const extracted = normalizePdfText(data);

      if (!extracted || !extracted.trim()) {
        throw new Error("No readable text found in PDF.");
      }

      return extracted;
    } catch (error) {
      console.error("Text extraction error:", error);
      throw new Error("Could not extract text from this PDF document.");
    }
  }

  if (ext === ".ppt" || ext === ".pptx") {
    try {
      const extracted = await new Promise<string>((resolve, reject) => {
        officeParser.parseOffice(absolutePath, (data, err) => {
          if (err) return reject(err);
          resolve((data as string) || "");
        });
      });

      if (!extracted.trim()) {
        throw new Error("No readable text found in presentation.");
      }

      return extracted;
    } catch (error) {
      console.error("Text extraction error:", error);
      throw new Error("Could not extract text from this presentation.");
    }
  }

  throw new Error("Unsupported file format for text extraction.");
}
