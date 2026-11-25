"use client";
import { startTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ME_SAVED } from "@/lib/me";

// The rows in Collections are drawn on the server, but their Star buttons save through /api/me, which only updates the
// browser's copy of the signed-in state. After a star or unstar lands, ask the server for the page again so the rows,
// the counts and the install command follow. The Remove forms get the same result from revalidatePath.
export function RefreshOnSave() {
  const router = useRouter();
  useEffect(() => {
    const go = () => startTransition(() => router.refresh());
    window.addEventListener(ME_SAVED, go);
    return () => window.removeEventListener(ME_SAVED, go);
  }, [router]);
  return null;
}
