"use client";

import { useEffect, useRef, useState } from "react";
import type { InterviewMessage } from "@/lib/types";
import { getProfileFields } from "@/lib/interview-profile";
import PhotoCropModal from "@/components/PhotoCropModal";

type LoadState = "loading" | "ready" | "not_found" | "error";

const OPTIMISTIC_ID_PREFIX = "optimistic-";

// ブラウザ内蔵の音声認識(Web Speech API)の最小限の型定義。
// TypeScriptの標準型に含まれていないため自前で定義する。
type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

// 対応ブラウザ(Chrome / Safari / Edge等)なら音声認識のコンストラクタを返す。
function getSpeechRecognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

export default function InterviewChat({ token }: { token: string }) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [articleType, setArticleType] = useState("");
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<{ fieldKey: string; file: File } | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // 音声認識に対応したブラウザでのみマイクボタンを表示する。
  // (サーバー側描画とのずれを防ぐため、描画後の次フレームで反映する)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setSpeechSupported(getSpeechRecognitionConstructor() !== null);
    });
    return () => {
      cancelAnimationFrame(frame);
      recognitionRef.current?.stop();
    };
  }, []);

  // マイクボタンで音声入力を開始/停止する。話した内容は入力欄に追記され、
  // 送信前に自由に修正できる(送信はこれまで通り送信ボタン/Enter)。
  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionCtor = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          transcript += result[0].transcript;
        }
      }
      if (transcript) {
        setInput((prev) => prev + transcript);
        requestAnimationFrame(resizeTextarea);
      }
    };

    recognition.onend = () => {
      // 無音が続くとブラウザ側で自動終了するため、状態を合わせる。
      setIsRecording(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("マイクの使用が許可されていません。ブラウザの設定でマイクを許可してください。");
      }
      setIsRecording(false);
      recognitionRef.current = null;
    };

    setError(null);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

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
      setNeedsProfile(data.needsProfile ?? false);
      setArticleType(data.articleType ?? "");
      setLoadState("ready");
      if (data.sessionStatus !== "completed" && !data.needsProfile) {
        focusInput();
      }
    }

    load().catch(() => setLoadState("error"));
  }, [token]);

  // 顔写真が選択されたら、まず切り取り位置を選ぶモーダルを開く。
  function handleProfilePhotoSelected(
    fieldKey: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingPhoto({ fieldKey, file });
  }

  // 切り取り後の画像をアップロードし、URLを回答値として保存する。
  async function uploadCroppedPhoto(blob: Blob) {
    if (!pendingPhoto) return;
    const { fieldKey } = pendingPhoto;
    setPendingPhoto(null);
    setIsUploadingPhoto(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", blob, "photo.jpg");

    const res = await fetch(`/api/interview/${token}/photo`, {
      method: "POST",
      body: formData,
    });

    setIsUploadingPhoto(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "写真のアップロードに失敗しました。");
      return;
    }

    const data = await res.json();
    setProfileValues((prev) => ({ ...prev, [fieldKey]: data.url }));
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmittingProfile) return;

    setIsSubmittingProfile(true);
    setError(null);

    const res = await fetch(`/api/interview/${token}/chat`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: profileValues }),
    });

    setIsSubmittingProfile(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "送信に失敗しました。もう一度お試しください。");
      return;
    }

    const data = await res.json();
    setMessages(data.messages ?? []);
    setProgress(data.progress ?? 0);
    setNeedsProfile(false);
    focusInput();
  }

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
      {pendingPhoto && (
        <PhotoCropModal
          file={pendingPhoto.file}
          onCancel={() => setPendingPhoto(null)}
          onCropped={uploadCroppedPhoto}
        />
      )}
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

      {needsProfile ? (
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-md">
            <h2 className="mb-2 text-base font-bold text-gray-900">
              インタビューの前に、基本情報のアンケートにご協力ください
            </h2>
            <p className="mb-5 text-sm text-gray-500">
              記事のプロフィール欄などに使用します。「*」の付いた項目は必須です。
            </p>

            <form onSubmit={submitProfile} className="space-y-4">
              {getProfileFields(articleType).map((field) => (
                <div key={field.key}>
                  <label
                    htmlFor={`profile-${field.key}`}
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    {field.label}
                    {field.required && " *"}
                  </label>
                  {field.type === "photo" ? (
                    <div className="flex items-center gap-4">
                      {profileValues[field.key] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profileValues[field.key]}
                          alt="顔写真プレビュー"
                          className="h-20 w-20 rounded-full border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-gray-300 text-xs text-gray-400">
                          未設定
                        </div>
                      )}
                      <div>
                        <input
                          id={`profile-${field.key}`}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handleProfilePhotoSelected(field.key, e)}
                          disabled={isUploadingPhoto}
                          className="text-sm text-gray-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          {isUploadingPhoto
                            ? "アップロード中..."
                            : "円形に切り取って掲載されます(JPEG/PNG、5MBまで)"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <input
                      id={`profile-${field.key}`}
                      required={field.required}
                      value={profileValues[field.key] ?? ""}
                      onChange={(e) =>
                        setProfileValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                    />
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={isSubmittingProfile}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              >
                {isSubmittingProfile
                  ? "送信中...(最初の質問を準備しています)"
                  : "回答してインタビューを始める"}
              </button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          </div>
        </div>
      ) : (
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
          <div className="space-y-3 rounded-md bg-green-50 px-4 py-4 text-sm text-green-800">
            <p className="text-center font-semibold">
              ご協力ありがとうございました。インタビューは以上で終了です。
            </p>
            <p className="text-center">このままブラウザを閉じていただいて大丈夫です。</p>
            <div className="rounded-md bg-white/60 px-3 py-2 text-green-700">
              <p className="mb-1 font-semibold">今後の流れ</p>
              <p>
                1. いただいた回答をもとに記事を作成します
                <br />
                2. 公開前に、担当者から記事の内容のご確認と、掲載に必要な写真のご依頼をさせていただきます
                <br />
                3. ご確認が済みましたら記事を公開します
              </p>
              <p className="mt-1">
                ご不明な点は、このリンクをお送りした担当者までお気軽にご連絡ください。
              </p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      )}

      {!completed && !needsProfile && (
        <div className="border-t border-gray-200 p-4">
          {isRecording && (
            <p className="mb-2 flex items-center gap-2 text-xs text-rose-500">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />
              音声を聞き取っています... 話し終わったらマイクボタンで停止してください
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
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
            {speechSupported && (
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isSending}
                aria-label={isRecording ? "音声入力を停止" : "音声で入力"}
                title={isRecording ? "音声入力を停止" : "音声で入力"}
                className={`rounded-full border px-3 py-2 text-sm transition disabled:opacity-50 ${
                  isRecording
                    ? "animate-pulse border-rose-300 bg-rose-50 text-rose-600"
                    : "border-gray-300 bg-white text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                🎤
              </button>
            )}
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              送信
            </button>
          </form>
        </div>
      )}
      {error && <p className="px-4 pb-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
