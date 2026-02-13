"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function MainPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [convo_id, setConvoId] = useState<string>("");
  const [conversationTitle, setConversationTitle] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) router.replace("/");
  }, [isLoaded, user, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isLoaded)
    return (
      <div className="flex h-screen items-center justify-center bg-[#131314]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4285f4] border-t-transparent"></div>
      </div>
    );

  if (!user) return null;

  async function send_convo() {
    if (!query.trim() || loading) return;

    const currentQuery = query;

    setMessages((prev) => [...prev, { role: "user", content: currentQuery }]);

    setQuery("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: currentQuery,
          conversationId: convo_id,
          user_id: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // First message → set conversation id
        if (!convo_id && data.convor_id) {
          setConvoId(data.convor_id);
        }

        // First message → set title
        if (!conversationTitle && data.title) {
          setConversationTitle(data.title);
        }

        const assistantText = data.response ?? "No response";

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantText },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Something went wrong." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Server error. Try again." },
      ]);
    }

    setLoading(false);
  }

  function newChat() {
    setConvoId("");
    setConversationTitle("");
    setMessages([]);
  }

  return (
    <div className="flex h-screen w-full bg-[#131314] text-[#e3e3e3] selection:bg-[#3d4451]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#1e1f20] bg-[#0f0f10]">
        <div className="p-4">
          <button
            className="w-full rounded-lg bg-[#1e1f20] py-2 text-sm hover:bg-[#28292a] transition-colors"
            onClick={newChat}
          >
            + New Chat
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
            {/* Title (only show if exists) */}
            {conversationTitle && (
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-semibold text-[#e3e3e3]">
                  {conversationTitle}
                </h1>
                <div className="mt-2 h-[1px] bg-[#1e1f20]" />
              </div>
            )}

            {/* Welcome state */}
            {messages.length === 0 && !conversationTitle && (
              <div className="mt-20">
                <h1 className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-5xl font-semibold text-transparent md:text-6xl">
                  Hello, {user.firstName}
                </h1>
                <h2 className="mt-2 text-4xl font-medium text-[#444746] md:text-5xl">
                  How can I help you today?
                </h2>
              </div>
            )}

            <div className="space-y-10">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      msg.role === "user"
                        ? "bg-[#3d4451]"
                        : "bg-gradient-to-tr from-[#4285f4] to-[#9b72cb]"
                    }`}
                  >
                    {msg.role === "user" ? "Y" : "G"}
                  </div>

                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-2xl px-5 py-3 text-[15px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#1e1f20] ring-1 ring-[#37393b]"
                          : "bg-transparent"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-4 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] opacity-50" />
                  <div className="h-3 w-40 rounded bg-[#1e1f20]" />
                </div>
              )}
            </div>

            <div ref={bottomRef} className="h-32" />
          </div>
        </main>

        {/* Input */}
        <footer className="w-full bg-[#131314] px-4 pb-6 pt-2 border-t border-[#1e1f20]">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center rounded-[32px] bg-[#1e1f20] py-1.5 pl-6 pr-2 hover:bg-[#28292a]">
              <input
                type="text"
                value={query}
                placeholder="Enter a prompt here"
                className="flex-1 bg-transparent py-3 text-[16px] outline-none"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send_convo();
                }}
              />
              <button
                onClick={send_convo}
                disabled={loading || !query.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[#37393b] disabled:opacity-20"
              >
                ↑
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
