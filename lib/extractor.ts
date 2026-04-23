/**
 * lib/extractor.ts
 *
 * Production-ready PDF text extraction for Next.js App Router (Node.js runtime).
 *
 * Extraction pipeline:
 *   1. pdf-parse  (primary – fast, accurate for text-layer PDFs)
 *   2. unpdf      (fallback – pdfjs-dist based, handles more edge cases)
 *
 * WHY NOT TESSERACT HERE:
 *   Tesseract.js passes bytes to Leptonica for decoding. Leptonica explicitly
 *   rejects PDF inputs ("Pdf reading is not supported"). A proper scanned-PDF
 *   OCR path requires pdfjs-dist to rasterise each page into a PNG, then feed
 *   those images to Tesseract.  That requires the `canvas` native addon and is
 *   beyond scope; add it as a separate step if needed.
 *
 * pdf-parse v2 API notes:
 *   - No default export (ESM shim is broken).
 *   - `PDFParse` is a named class exported from the CJS build.
 *   - Constructor signature: `new PDFParse({ data: Buffer, verbosity?: number })`
 *   - Text extracted via: `instance.getText()` → `{ text: string, pages: … }`
 *   - Use `createRequire` so the bundler never touches the CJS file.
 */

import { createRequire } from "module";
import fs from "fs/promises";
import path from "path";
import { extractText as unpdfExtractText } from "unpdf";

// ─── CJS interop for pdf-parse ────────────────────────────────────────────────
// createRequire bypasses Next.js/Turbopack bundling and loads the true CJS
// entry point, avoiding the broken ESM shim that has no default export.
const _require = createRequire(import.meta.url);

interface PdfTextResult {
  text: string;
  pages: Array<{ text: string; num: number }>;
}

interface PdfParseOptions {
  data: Buffer;
  verbosity?: number;
}

const { PDFParse } = _require("pdf-parse") as {
  PDFParse: new (opts: PdfParseOptions) => { getText(): Promise<PdfTextResult> };
};

// ─── Text cleaning ─────────────────────────────────────────────────────────
function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")        // normalise CRLF → LF
    .replace(/\r/g, "\n")          // normalise stray CR → LF
    .replace(/[ \t]+/g, " ")       // collapse horizontal whitespace
    .replace(/\n{3,}/g, "\n\n")    // at most one blank line between paragraphs
    .trim();
}

// ─── Primary: pdf-parse ────────────────────────────────────────────────────
async function extractWithPdfParse(buffer: Buffer): Promise<string> {
  // PDFParse v2: data goes into the constructor, verbosity suppresses console
  // noise from pdfjs-dist (0 = silence, 1 = errors, 5 = all).
  const instance = new PDFParse({ data: buffer, verbosity: 0 });
  const result = await instance.getText();
  return cleanText(result.text ?? "");
}

// ─── Fallback: unpdf ───────────────────────────────────────────────────────
// unpdf wraps pdfjs-dist and works natively in ESM/Next.js without bundling
// issues. mergePages concatenates all pages into a single string.
async function extractWithUnpdf(buffer: Buffer): Promise<string> {
  const { text } = await unpdfExtractText(new Uint8Array(buffer), {
    mergePages: true,
  });
  // text can be string (mergePages:true) or string[] (mergePages:false)
  const merged = Array.isArray(text) ? text.join("\n") : (text ?? "");
  return cleanText(merged);
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Extracts clean plain text from a PDF file.
 *
 * Tries pdf-parse first (fast, accurate for digital/text-layer PDFs).
 * Falls back to unpdf when:
 *   – pdf-parse throws an error, OR
 *   – pdf-parse returns an empty / whitespace-only result.
 *
 * @param filePath  Absolute or relative path to the PDF.
 *                  Relative paths are resolved from `process.cwd()`.
 * @returns         Clean, whitespace-normalised plain text ready to pass to
 *                  an LLM (e.g. Gemini).
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  // ── Resolve path ──────────────────────────────────────────────────────────
  const normalised = filePath.replace(/^[\\/]+/, "");
  const absolutePath = path.isAbsolute(normalised)
    ? normalised
    : path.resolve(process.cwd(), normalised);

  const ext = path.extname(absolutePath).toLowerCase();
  if (ext !== ".pdf") {
    throw new Error(`Unsupported file type "${ext}". Only PDF is supported.`);
  }

  // ── Read file ─────────────────────────────────────────────────────────────
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(absolutePath);
  } catch (err) {
    throw new Error(
      `Cannot read file at "${absolutePath}": ${(err as Error).message}`
    );
  }

  // ── Stage 1: pdf-parse ────────────────────────────────────────────────────
  let primaryText = "";
  try {
    primaryText = await extractWithPdfParse(buffer);
  } catch (err) {
    console.warn(
      "[extractor] pdf-parse failed, will try unpdf fallback:",
      (err as Error).message
    );
  }

  if (primaryText.length > 0) {
    console.info(
      `[extractor] pdf-parse succeeded (${primaryText.length} chars)`
    );
    return primaryText;
  }

  // ── Stage 2: unpdf fallback ───────────────────────────────────────────────
  console.info(
    "[extractor] pdf-parse returned empty text – falling back to unpdf…"
  );

  let fallbackText = "";
  try {
    fallbackText = await extractWithUnpdf(buffer);
  } catch (err) {
    console.error("[extractor] unpdf fallback failed:", (err as Error).message);
    throw new Error(
      "Could not extract text from this PDF. " +
        "The file may be corrupt, password-protected, or a scanned image-only PDF " +
        "with no text layer. For scanned PDFs, an OCR preprocessing step is required."
    );
  }

  if (!fallbackText || fallbackText.trim().length === 0) {
    throw new Error(
      "No readable text found in this PDF (tried pdf-parse and unpdf). " +
        "The file may be a scanned image-only PDF with no embedded text layer."
    );
  }

  console.info(
    `[extractor] unpdf fallback succeeded (${fallbackText.length} chars)`
  );
  return fallbackText;
}
