"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  role: "user" | "assistant";
  content: string;
  source?: string | null;
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

  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  async function send_web_search() {
    if (!query.trim() || loading) return;

    const currentQuery = query;

    setMessages((prev) => [...prev, { role: "user", content: currentQuery }]);
    setQuery("");
    setLoading(true);

    try {
      const response = await fetch("/api/web-search", {
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

        const formattedSource = Array.isArray(data.source)
          ? data.source.join(", ")
          : data.source;

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response ?? "No response",
            source: formattedSource ?? undefined,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Web search failed." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Server error." },
      ]);
    }

    setLoading(false);
  }
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

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response ?? "No response",
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
        { role: "assistant", content: "Server error." },
      ]);
    }

    setLoading(false);
  }

  function newChat() {
    setConvoId("");
    setConversationTitle("");
    setMessages([]);
    setSidebarOpen(false);
  }

  async function loadConversation(conversation: SidebarConversation) {
    setConvoId(conversation.id);
    setConversationTitle(conversation.title);
    setSidebarOpen(false);

    const res = await fetch("/api/loadConversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: conversation.id }),
    });

    const data = await res.json();

    if (res.ok && data.messages) {
      setMessages(
        data.messages.map((msg: Message) => ({
          role: msg.role,
          content: msg.content,
          source: msg.source ?? undefined,
        })),
      );
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#131314] text-[#e3e3e3]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static z-40 h-screen w-64 flex flex-col
        border-r border-[#1e1f20] bg-[#0f0f10]
        transform transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0`}
      >
        <div className="p-4">
          <button
            className="w-full rounded-xl bg-[#1e1f20] py-2 text-sm font-medium
            hover:bg-[#2a2b2c] transition-colors"
            onClick={newChat}
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          {sidebarConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => loadConversation(conversation)}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm
              text-[#c4c7c5] hover:bg-[#1e1f20] truncate transition"
            >
              {conversation.title}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-12">
            {/* Greeting */}
            {messages.length === 0 && !conversationTitle && (
              <div className="mt-20 text-center">
                <h1
                  className="bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570]
                bg-clip-text text-5xl font-semibold text-transparent"
                >
                  Hello, {user.firstName}
                </h1>
                <h2 className="mt-3 text-2xl text-[#444746] font-medium">
                  How can I help you today?
                </h2>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-10">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="max-w-[80%]">
                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-5 py-3 text-[15px] leading-relaxed
                      ${
                        msg.role === "user"
                          ? "bg-[#1e1f20] ring-1 ring-[#2b2c2d]"
                          : "bg-transparent"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Source Pill */}
                    {msg.role === "assistant" && msg.source && (
                      <div
                        className="mt-3 inline-flex items-center gap-2
                      rounded-full bg-[#1e1f20] px-3 py-1.5
                      text-xs text-[#9aa0a6] ring-1 ring-[#2b2c2d] break-all"
                      >
                        <span className="h-2 w-2 rounded-full bg-[#4285f4]" />
                        <span>{msg.source}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div ref={bottomRef} className="h-24" />
          </div>
        </main>

        {/* Floating Input */}
        <footer className="sticky bottom-0 bg-gradient-to-t from-[#131314] via-[#131314]/95 to-transparent pt-6 pb-6">
          <div className="mx-auto max-w-3xl px-4">
            <div
              className="flex items-center rounded-full bg-[#1e1f20]
            px-4 py-2 shadow-lg ring-1 ring-[#2b2c2d]"
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send_convo();
                }}
                placeholder="Enter a prompt here"
                className="flex-1 bg-transparent text-[15px] outline-none"
              />

              <button
                onClick={send_convo}
                className="ml-2 h-9 w-9 rounded-full flex items-center justify-center
                hover:bg-[#2a2b2c] transition"
              >
                ↑
              </button>

              <button
                onClick={send_web_search}
                className="ml-1 h-9 w-9 rounded-full flex items-center justify-center
                hover:bg-[#2a2b2c] transition"
              >
                🌐
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
