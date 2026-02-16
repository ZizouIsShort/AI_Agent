"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton, SignUpButton, SignedOut } from "@clerk/nextjs";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (hasSynced.current) return;

    hasSynced.current = true;

    const syncUser = async () => {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          email: user.emailAddresses[0].emailAddress,
        }),
      });

      if (res.ok) {
        router.replace("/main");
      } else {
        console.error("Auth sync failed");
      }
    };

    syncUser();
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#131314] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#4285f4] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#131314] text-[#e3e3e3] px-6">
      <div className="w-full max-w-md rounded-2xl bg-[#1e1f20] p-10 shadow-xl ring-1 ring-[#2a2b2d] text-center space-y-8">
        <h1 className="text-4xl font-semibold bg-gradient-to-r from-[#4285f4] via-[#9b72cb] to-[#d96570] bg-clip-text text-transparent">
          Zizou's AI Agent
        </h1>

        <p className="text-sm text-[#8e918f]">
          Sign in to continue your conversations.
        </p>

        <SignedOut>
          <div className="flex flex-col gap-4">
            <SignInButton>
              <button className="w-full rounded-xl bg-[#28292a] py-3 text-sm font-medium hover:bg-[#37393b] transition-colors">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton>
              <button className="w-full rounded-xl bg-gradient-to-r from-[#4285f4] to-[#9b72cb] py-3 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                Create Account
              </button>
            </SignUpButton>
          </div>
        </SignedOut>
      </div>
    </div>
  );
}
