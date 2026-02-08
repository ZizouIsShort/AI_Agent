"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MainPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.replace("/");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-[#131314] text-[#e3e3e3] font-sans selection:bg-blue-500/30">
      <main className="px-4">
        <div className="mx-auto flex min-h-[70vh] max-w-[820px] flex-col justify-center py-20">
          <div className="mb-12 transition-opacity duration-1000">
            <h1 className="text-5xl font-medium tracking-tight bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent pb-3">
              Hello, {user.emailAddresses[0].emailAddress}
            </h1>
            <h2 className="text-4xl font-medium text-[#444746]">
              How can I help you today?
            </h2>
          </div>

          <div className="w-full space-y-8"></div>
        </div>
      </main>

      {/* Sticky Bottom Input Area */}
      <footer className="sticky bottom-0 w-full bg-[#131314]/80 backdrop-blur-xl px-4 pb-8 pt-4">
        <div className="mx-auto max-w-[820px]">
          <div className="group relative flex items-center rounded-[32px] bg-[#1e1f20] px-6 py-4 hover:bg-[#28292a] focus-within:bg-[#28292a] transition-all duration-200 shadow-2xl">
            <input
              type="text"
              placeholder="Enter a prompt here"
              className="w-full bg-transparent text-[17px] text-[#e3e3e3] outline-none placeholder:text-[#8e918f]"
            />

            <div className="flex items-center gap-2 pl-2">
              {/* Media Upload */}
              <button className="p-2 text-[#e3e3e3] hover:bg-[#37393b] rounded-full transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </button>

              {/* Submit Button */}
              <button className="p-2 text-[#e3e3e3] hover:text-white transition-colors">
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
                  className="rotate-90"
                >
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
              </button>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] text-[#8e918f] opacity-80">
            Ziyan's AI agent (inshallah it works)
          </p>
        </div>
      </footer>
    </div>
  );
}
