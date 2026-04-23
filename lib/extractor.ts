import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import officeParser from "officeparser";

declare global {
  interface PromiseConstructor {
    try?<T>(
      callback: () => T | PromiseLike<T>,
    ): Promise<Awaited<T>>;
  }
}

function ensurePromiseTryPolyfill(): void {
  if (typeof Promise.try !== "function") {
    Promise.try = <T>(callback: () => T | PromiseLike<T>) =>
      new Promise<Awaited<T>>((resolve, reject) => {
        try {
          resolve(callback() as Awaited<T>);
        } catch (error) {
          reject(error);
        }
      });
  }
}

ensurePromiseTryPolyfill();

export async function extractTextFromFile(filePath: string): Promise<string> {
  const normalizedPath = filePath.replace(/^[\\/]+/, "");
  const absolutePath = path.resolve(process.cwd(), normalizedPath);

  const ext = path.extname(absolutePath).toLowerCase();

  if (ext === ".pdf") {
    try {
      const dataBuffer = await fs.readFile(absolutePath);
      const parsed = await pdfParse(dataBuffer);
      const extracted = parsed.text;

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
