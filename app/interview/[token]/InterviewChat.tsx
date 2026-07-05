"use client";

import { useEffect, useRef, useState } from "react";
import type { InterviewMessage } from "@/lib/types";

type LoadState = "loading" | "ready" | "not_found" | "error";

export default function InterviewChat({ token }: { token: string }) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [completed, setCompleted] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/interview/${token}/chat`);

      if (res.status === 404) {
        setLoadState("not_found");
        return;
      }
      if (!res.ok) {
        setLoadState("error");
        return;
      }

      const data = await res.json();
      setMessages(data.messages ?? []);
      setCompleted(data.sessionStatus === "completed");
      setLoadState("ready");
    }

    load().catch(() => setLoadState("error"));
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || isSending || completed) return;

    setIsSending(true);
    setError(null);
    setInput("");

    const res = await fetch(`/api/interview/${token}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    setIsSending(false);

    if (!res.ok) {
      setError("送信に失敗しました。もう一度お試しください。");
      setInput(message);
      return;
    }

    const data = await res.json();
    setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
    setCompleted(data.completed);
  }

  if (loadState === "loading") {
    return <p className="p-6 text-center text-sm text-gray-500">読み込み中...</p>;
  }

  if (loadState === "not_found") {
    return (
      <p className="p-6 text-center text-sm text-gray-500">
        このインタビューリンクは見つかりませんでした。リンクをご確認ください。
      </p>
    );
  }

  if (loadState === "error") {
    return (
      <p className="p-6 text-center text-sm text-red-600">
        読み込みに失敗しました。ページを再読み込みしてください。
      </p>
    );
  }

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col">
      <header className="border-b border-gray-200 px-4 py-4">
        <h1 className="text-lg font-bold text-gray-900">A.Interview</h1>
        <p className="text-sm text-gray-500">AIチャットに答えるだけでインタビューが完了します</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {completed && (
          <p className="rounded-md bg-green-50 px-4 py-3 text-center text-sm text-green-700">
            ご協力ありがとうございました。インタビューは終了です。
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {!completed && (
        <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-200 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isSending}
            placeholder="メッセージを入力..."
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            送信
          </button>
        </form>
      )}
      {error && <p className="px-4 pb-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
