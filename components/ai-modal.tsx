"use client";

import { useState, useRef, useEffect } from "react";
import { Note } from "./dashboard/notes-list";
import { Button } from "./ui/button";

// ---------------------------------------------------------------------------
// Lightweight Markdown → HTML renderer
// Handles: ## headings, **bold**, *italic*, `code`, bullet lists, blank lines
// Source is always our own Gemini API so dangerouslySetInnerHTML is safe here.
// ---------------------------------------------------------------------------
function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const raw of lines) {
    const line = raw.trimEnd();

    // Headings
    if (/^### (.+)/.test(line)) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3 class="md-h3">${inline(line.replace(/^### /, ""))}</h3>`);
    } else if (/^## (.+)/.test(line)) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2 class="md-h2">${inline(line.replace(/^## /, ""))}</h2>`);
    } else if (/^# (.+)/.test(line)) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1 class="md-h1">${inline(line.replace(/^# /, ""))}</h1>`);
    }
    // Bullet list item (-, *, •)
    else if (/^[-*•] (.+)/.test(line)) {
      if (!inList) { html.push("<ul class=\"md-ul\">"); inList = true; }
      html.push(`<li class="md-li">${inline(line.replace(/^[-*•] /, ""))}</li>`);
    }
    // Blank line → paragraph break
    else if (line.trim() === "") {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push("<br/>");
    }
    // Normal paragraph
    else {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<p class="md-p">${inline(line)}</p>`);
    }
  }

  if (inList) html.push("</ul>");
  return html.join("\n");
}

/** Inline elements: bold, italic, inline code */
function inline(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="md-strong">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em class="md-em">$1</em>')
    .replace(/__([^_]+)__/g, '<strong class="md-strong">$1</strong>')
    .replace(/_([^_]+)_/g, '<em class="md-em">$1</em>');
}

// ---------------------------------------------------------------------------

type AIModalProps = {
  mode: "summary" | "chat";
  note: Note;
  onClose: () => void;
};

export function AIModal({ mode, note, onClose }: AIModalProps) {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "summary") generateSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId: note.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSummary(data.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setSummary(`**Error generating summary:** ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: "user", content: chatInput };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setChatInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, noteId: note.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setMessages([...newMessages, { role: "ai", content: data.text }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages([...newMessages, { role: "ai", content: `**Error:** ${msg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    alert("Copied to clipboard");
  };

  return (
    <>
      {/* Scoped styles for the markdown renderer */}
      <style>{`
        .md-h1 { font-size: 1.25rem; font-weight: 700; margin: 0.75rem 0 0.25rem; color: #0c4b9c; }
        .md-h2 { font-size: 1.05rem; font-weight: 700; margin: 0.75rem 0 0.25rem; color: #0c4b9c; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px; }
        .md-h3 { font-size: 0.95rem; font-weight: 600; margin: 0.5rem 0 0.15rem; color: #1e40af; }
        .md-p  { margin: 0.2rem 0; line-height: 1.6; }
        .md-ul { list-style: disc; padding-left: 1.4rem; margin: 0.25rem 0; }
        .md-li { margin: 0.15rem 0; line-height: 1.55; }
        .md-strong { font-weight: 700; color: #1e293b; }
        .md-em { font-style: italic; }
        .md-code {
          font-family: ui-monospace, monospace;
          font-size: 0.82em;
          background: #f1f5f9;
          color: #0f172a;
          border-radius: 3px;
          padding: 1px 5px;
          border: 1px solid #e2e8f0;
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="flex h-[82vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-xl relative">
          {/* Close button */}
          <button
            className="absolute right-4 top-4 w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors font-bold text-sm"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>

          {/* Title */}
          <h2 className="text-xl font-semibold mb-4 text-[#0C4B9C] pr-8">
            {mode === "summary" ? "📄 AI Summary" : "💬 Ask AI"}
            <span className="text-slate-400 font-normal text-base ml-2 truncate">
              — {note.title}
            </span>
          </h2>

          {/* ── SUMMARY MODE ── */}
          {mode === "summary" && (
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
              {isLoading && !summary && (
                <div className="flex items-center gap-3 text-slate-500 text-sm mt-6">
                  <span className="animate-spin text-[#0C4B9C]">⟳</span>
                  Analyzing document and generating summary…
                </div>
              )}
              {summary && (
                <>
                  <div
                    className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }}
                  />
                  <Button onClick={copySummary} variant="secondary" className="self-end">
                    Copy Summary
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ── CHAT MODE ── */}
          {mode === "chat" && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Message list */}
              <div className="flex-1 overflow-y-auto mb-3 p-3 border rounded-xl bg-slate-50 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center text-slate-400 text-sm mt-10">
                    Ask any question about <b className="text-slate-600">{note.title}</b>
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm ${
                        m.role === "user"
                          ? "bg-[#0C4B9C] text-white"
                          : "bg-white border text-slate-800"
                      }`}
                    >
                      {m.role === "user" ? (
                        // User messages: plain text (no Markdown rendering)
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      ) : (
                        // AI messages: rendered Markdown
                        <div
                          className="leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                        />
                      )}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border rounded-xl px-3 py-2 text-sm text-slate-400 flex items-center gap-2 shadow-sm">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse delay-75">●</span>
                      <span className="animate-pulse delay-150">●</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleChat} className="flex gap-2">
                <input
                  className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B9C] bg-white"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask a question about this note…"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>
                  Send
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
