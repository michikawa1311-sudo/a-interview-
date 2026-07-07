"use client";

import { useEffect, useRef, useState } from "react";
import type { InterviewMessage } from "@/lib/types";

type LoadState = "loading" | "ready" | "not_found" | "error";

const OPTIMISTIC_ID_PREFIX = "optimistic-";

export default function InterviewChat({ token }: { token: string }) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      setProgress(data.progress ?? 0);
      setLoadState("ready");
      if (data.sessionStatus !== "completed") {
        focusInput();
      }
    }

    load().catch(() => setLoadState("error"));
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  function resizeTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  // AIの返答が表示された後、毎回入力欄をクリックし直さなくて済むよう自動でフォーカスする。
  // disabledが解除された直後の描画を待つため、次のフレームで実行する。
  function focusInput() {
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  async function sendMessage() {
    const message = input.trim();
    if (!message || isSending || completed) return;

    // AIの返答を待たず、まず自分の発言だけをすぐに画面へ反映する。
    const optimisticId = `${OPTIMISTIC_ID_PREFIX}${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        session_id: "",
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      },
    ]);

    setIsSending(true);
    setError(null);
    setInput("");
    requestAnimationFrame(resizeTextarea);

    const res = await fetch(`/api/interview/${token}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    setIsSending(false);

    if (!res.ok) {
      setError("送信に失敗しました。もう一度お試しください。");
      setInput(message);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      focusInput();
      return;
    }

    const data = await res.json();
    setMessages((prev) => [
      ...prev.filter((m) => m.id !== optimisticId),
      data.userMessage,
      data.assistantMessage,
    ]);
    setCompleted(data.completed);
    setProgress(data.progress ?? 0);
    if (!data.completed) {
      focusInput();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage();
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Shift+Enter / Ctrl+Enter は改行、Enter単体は送信。
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function startEditing(message: InterviewMessage) {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  }

  function cancelEditing() {
    setEditingMessageId(null);
    setEditingContent("");
  }

  async function saveEditing() {
    const content = editingContent.trim();
    if (!editingMessageId || !content || isSavingEdit) return;

    setIsSavingEdit(true);
    setError(null);

    const res = await fetch(`/api/interview/${token}/chat`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: editingMessageId, content }),
    });

    setIsSavingEdit(false);

    if (!res.ok) {
      setError("回答の更新に失敗しました。もう一度お試しください。");
      return;
    }

    const data = await res.json();

    // 編集した回答より後のやり取りは、古い内容をもとにAIが考えたものなので
    // サーバー側で破棄・再生成されている。フロント側の表示もそれに合わせて置き換える。
    setMessages((prev) => {
      const index = prev.findIndex((m) => m.id === editingMessageId);
      if (index === -1) return prev;
      return [...prev.slice(0, index), data.message, data.assistantMessage];
    });
    setCompleted(data.completed ?? false);
    setProgress(data.progress ?? 0);
    cancelEditing();
    if (!data.completed) {
      focusInput();
    }
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
        <p className="mb-3 text-sm text-gray-500">AIチャットに答えるだけでインタビューが完了します</p>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-gray-400">回答の進み具合: 約{progress}%</p>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`group flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {editingMessageId === m.id ? (
              <div className="w-[80%] space-y-2">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-indigo-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={isSavingEdit}
                    className="rounded-full px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
                  >
                    キャンセル
                  </button>
                  <button
                    type="button"
                    onClick={saveEditing}
                    disabled={isSavingEdit || !editingContent.trim()}
                    className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isSavingEdit ? "保存中..." : "保存する"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex max-w-[80%] items-end gap-1">
                {m.role === "user" && !completed && !m.id.startsWith(OPTIMISTIC_ID_PREFIX) && (
                  <button
                    type="button"
                    onClick={() => startEditing(m)}
                    aria-label="この回答を編集する"
                    className="mb-1 shrink-0 whitespace-nowrap text-xs font-medium text-indigo-500 underline underline-offset-2 hover:text-indigo-700"
                  >
                    編集
                  </button>
                )}
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            )}
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-4 py-2 text-sm text-gray-400">
              AIが返答を考えています...
            </div>
          </div>
        )}
        {completed && (
          <p className="rounded-md bg-green-50 px-4 py-3 text-center text-sm text-green-700">
            ご協力ありがとうございました。インタビューは終了です。
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      {!completed && (
        <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-gray-200 p-4">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeTextarea();
            }}
            onKeyDown={handleInputKeyDown}
            disabled={isSending}
            rows={1}
            placeholder="メッセージを入力...(Shift+EnterまたはCtrl+Enterで改行)"
            className="max-h-40 flex-1 resize-none overflow-y-auto rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
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
