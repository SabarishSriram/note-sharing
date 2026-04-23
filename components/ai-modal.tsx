"use client";

import { useState, useRef, useEffect } from "react";
import { Note } from "./dashboard/notes-list";
import { Button } from "./ui/button";

type AIModalProps = {
  mode: "summary" | "chat";
  note: Note;
  onClose: () => void;
};

export function AIModal({ mode, note, onClose }: AIModalProps) {
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "summary") {
      generateSummary();
    }
  }, [mode]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
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
    } catch (err: any) {
      setSummary("Error generating summary: " + err.message);
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
    } catch (err: any) {
      setMessages([...newMessages, { role: "ai", content: "Error: " + err.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    alert("Copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-white p-6 shadow-xl relative">
        <button
          className="absolute right-4 top-4 text-slate-500 hover:text-slate-800 font-bold"
          onClick={onClose}
        >
          X
        </button>
        <h2 className="text-xl font-semibold mb-4 text-[#0C4B9C]">
          {mode === "summary" ? "AI Summary: " : "Ask AI: "} 
          {note.title}
        </h2>
        
        {mode === "summary" && (
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col space-y-4">
            {isLoading && !summary && <div className="animate-pulse">Analyzing document and generating summary...</div>}
            {summary && (
              <>
                <div className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border">
                  {summary}
                </div>
                <Button onClick={copySummary} variant="secondary" className="self-end">
                  Copy Summary
                </Button>
              </>
            )}
          </div>
        )}

        {mode === "chat" && (
          <div className="flex flex-col flex-1 overflow-hidden h-full">
            <div className="flex-1 overflow-y-auto mb-4 p-4 border rounded-xl bg-slate-50 space-y-4">
               {messages.length === 0 && (
                 <div className="text-center text-slate-500 text-sm mt-10">
                    Ask any doubt regarding <b>{note.title}</b>!
                 </div>
               )}
               {messages.map((m, idx) => (
                 <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] rounded-xl p-3 text-sm ${m.role === 'user' ? 'bg-[#0C4B9C] text-white' : 'bg-slate-200 text-slate-800'}`}>
                     <div className="whitespace-pre-wrap">{m.content}</div>
                   </div>
                 </div>
               ))}
               {isLoading && (
                 <div className="flex justify-start text-xs text-slate-400">AI is thinking...</div>
               )}
               <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleChat} className="flex gap-2">
              <input
                className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0C4B9C]"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>Send</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
