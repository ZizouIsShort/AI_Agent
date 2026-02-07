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
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">
        Welcome, {user.emailAddresses[0].emailAddress}
      </h1>

      <div className="mt-6">
        <p>Main dashboard ready.</p>
      </div>
    </div>
  );
}
