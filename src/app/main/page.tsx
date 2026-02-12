"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
  source?: string;
};

export default function MainPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [convo_id, setConvoId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function reload() {
    window.location.reload();
    console.log("reload done");
  }

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
    if (!query.trim()) return;

    const currentQuery = query;
    setQuery("");

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
      if (!convo_id && data.conversationId) {
        setConvoId(data.conversationId);
      }

      console.log("Assistant:", data.llmAnswer);
    } else {
      console.log("Error");
    }
  }

  /*async function sendQuery() {
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const currentQuery = query;
    setQuery("");

    try {
      const response = await fetch("/api/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: currentQuery }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.llmAnswer,
            source: data.source,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Something went wrong." },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Server error. Try again." },
      ]);
    }
    setLoading(false);
  }*/

  return (
    <div className="flex h-screen w-full bg-[#131314] text-[#e3e3e3] selection:bg-[#3d4451]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-[#1e1f20] bg-[#0f0f10]">
        {/* New Chat Button */}
        <div className="p-4">
          <button
            className="w-full rounded-lg bg-[#1e1f20] py-2 text-sm hover:bg-[#28292a] transition-colors"
            onClick={reload}
          >
            + New Chat
          </button>
        </div>

        {/* Previous Conversations Placeholder */}
        <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-4">
          <div className="rounded-md px-3 py-2 text-sm text-[#8e918f] hover:bg-[#1e1f20] cursor-pointer">
            Previous Chat 1
          </div>
          <div className="rounded-md px-3 py-2 text-sm text-[#8e918f] hover:bg-[#1e1f20] cursor-pointer">
            Previous Chat 2
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Scrollable Chat Container */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
            {/* Welcome State */}
            {messages.length === 0 && (
              <div className="mt-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <h1 className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-5xl font-semibold text-transparent md:text-6xl">
                  Hello, {user.firstName}
                </h1>
                <h2 className="mt-2 text-4xl font-medium text-[#444746] md:text-5xl">
                  How can I help you today?
                </h2>
              </div>
            )}

            {/* Conversation Thread */}
            <div className="space-y-10">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-4 md:gap-6 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
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

                  <div
                    className={`flex max-w-[85%] flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-5 py-3 text-[15px] leading-relaxed transition-all ${
                        msg.role === "user"
                          ? "bg-[#1e1f20] text-[#e3e3e3] ring-1 ring-[#37393b]"
                          : "bg-transparent text-[#e3e3e3]"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {msg.role === "assistant" && msg.source && (
                      <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#1e1f20] p-2 pr-4 text-[11px] text-[#c4c7c5] hover:bg-[#28292a] cursor-default ring-1 ring-[#37393b]">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-[#333537] text-[10px]">
                          1
                        </span>
                        <span className="truncate max-w-[200px]">
                          {msg.source}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-4 md:gap-6 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] opacity-50" />
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="h-3 w-48 rounded bg-[#1e1f20]" />
                    <div className="h-3 w-32 rounded bg-[#1e1f20]" />
                  </div>
                </div>
              )}
            </div>

            <div ref={bottomRef} className="h-32" />
          </div>
        </main>

        {/* Input Area */}
        <footer className="w-full bg-[#131314] px-4 pb-6 pt-2 border-t border-[#1e1f20]">
          <div className="mx-auto max-w-3xl">
            <div className="group relative flex items-center rounded-[32px] bg-[#1e1f20] py-1.5 pl-6 pr-2 transition-all focus-within:bg-[#28292a] hover:bg-[#28292a] ring-1 ring-transparent focus-within:ring-[#37393b]">
              <input
                type="text"
                value={query}
                autoFocus
                placeholder="Enter a prompt here"
                className="flex-1 bg-transparent py-3 text-[16px] text-[#e3e3e3] outline-none placeholder:text-[#8e918f]"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send_convo();
                }}
              />

              <button
                onClick={send_convo}
                disabled={loading || !query.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#e3e3e3] transition-all hover:bg-[#37393b] disabled:opacity-20"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
              </button>
            </div>

            <p className="mt-3 text-center text-[11px] tracking-wide text-[#8e918f]">
              Ziyan ka AI agent • (Inshallah it works)
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
