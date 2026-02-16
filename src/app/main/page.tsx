"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
  source?: string;
};

type SidebarConversation = {
  id: string;
  title: string;
};

export default function MainPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [convo_id, setConvoId] = useState<string>("");
  const [conversationTitle, setConversationTitle] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  const [sidebarConversations, setSidebarConversations] = useState<
    SidebarConversation[]
  >([]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) router.replace("/");
  }, [isLoaded, user, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!user?.id) return;

    const fetchSidebar = async () => {
      const res = await fetch("/api/sidebar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await res.json();

      if (res.ok && data.sbarWork) {
        setSidebarConversations(data.sbarWork);
      }
    };

    fetchSidebar();
  }, [user?.id]);

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
        if (!convo_id && data.convor_id) {
          setConvoId(data.convor_id);
        }

        if (!conversationTitle && data.title) {
          setConversationTitle(data.title);
        }

        const assistantText = data.response ?? "No response";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: assistantText,
            source: data.source ?? undefined,
          },
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
    window.location.reload();
  }

  async function loadConversation(conversation: SidebarConversation) {
    setConvoId(conversation.id);
    setConversationTitle(conversation.title);

    const res = await fetch("/api/loadConversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conversation.id }),
    });

    const data = await res.json();

    if (res.ok && data.messages) {
      setMessages(data.messages);
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#131314] text-[#e3e3e3] selection:bg-[#3d4451]">
      {/* Sidebar */}
      <aside className="hidden md:flex h-screen w-64 flex-shrink-0 flex-col border-r border-[#1e1f20] bg-[#0f0f10]">
        <div className="p-4">
          <button
            className="w-full rounded-lg bg-[#1e1f20] py-2 text-sm hover:bg-[#28292a] transition-colors"
            onClick={newChat}
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-2 pb-4">
          {sidebarConversations.length === 0 && (
            <p className="px-3 text-xs text-[#8e918f]">No conversations yet</p>
          )}

          {sidebarConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => loadConversation(conversation)}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-[#c4c7c5] hover:bg-[#1e1f20] truncate transition-colors"
            >
              {conversation.title}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12 md:px-6">
            {conversationTitle && (
              <div className="mb-6 md:mb-8 text-center">
                <h1 className="text-xl md:text-2xl font-semibold text-[#e3e3e3]">
                  {conversationTitle}
                </h1>
                <div className="mt-2 h-[1px] bg-[#1e1f20]" />
              </div>
            )}

            {messages.length === 0 && !conversationTitle && (
              <div className="mt-16 md:mt-20">
                <h1 className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-4xl md:text-6xl font-semibold text-transparent">
                  Hello, {user.firstName}
                </h1>
                <h2 className="mt-2 text-2xl md:text-5xl font-medium text-[#444746]">
                  How can I help you today?
                </h2>
              </div>
            )}

            <div className="space-y-8 md:space-y-10">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 md:gap-4 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      msg.role === "user"
                        ? "bg-[#3d4451]"
                        : "bg-gradient-to-tr from-[#4285f4] to-[#9b72cb]"
                    }`}
                  >
                    {msg.role === "user" ? "Y" : "G"}
                  </div>

                  <div className="max-w-[90%] md:max-w-[75%] flex flex-col">
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-[14px] md:text-[15px] leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#1e1f20] ring-1 ring-[#37393b]"
                          : "bg-transparent"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {msg.role === "assistant" && msg.source && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#1e1f20] px-3 py-2 text-[11px] md:text-xs text-[#c4c7c5] ring-1 ring-[#37393b] w-fit">
                        <span className="h-2 w-2 rounded-full bg-[#4285f4]" />
                        <span>{msg.source}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 md:gap-4 animate-pulse">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-gradient-to-tr from-[#4285f4] to-[#9b72cb] opacity-50" />
                  <div className="h-3 w-32 rounded bg-[#1e1f20]" />
                </div>
              )}
            </div>

            <div ref={bottomRef} className="h-24 md:h-32" />
          </div>
        </main>

        {/* Input */}
        <footer className="w-full bg-[#131314] px-3 md:px-4 pb-4 md:pb-6 pt-2 border-t border-[#1e1f20]">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center rounded-[28px] bg-[#1e1f20] py-1.5 pl-4 pr-2 hover:bg-[#28292a]">
              <input
                type="text"
                value={query}
                placeholder="Enter a prompt here"
                className="flex-1 bg-transparent py-3 text-[15px] md:text-[16px] outline-none"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send_convo();
                }}
              />
              <button
                onClick={send_convo}
                disabled={loading || !query.trim()}
                className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full hover:bg-[#37393b] disabled:opacity-20"
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
