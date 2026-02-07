"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

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

  return <p>Loading...</p>;
}
