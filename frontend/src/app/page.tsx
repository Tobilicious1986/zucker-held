"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";

export default function RootPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) {
      router.replace("/login");
    } else {
      router.replace("/dashboard");
    }
  }, [token, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-5xl animate-pulse">🩸</div>
    </div>
  );
}
