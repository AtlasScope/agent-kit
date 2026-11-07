"use client";

import { useRouter } from "next/navigation";

export function SignOut() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn ghost"
      onClick={() => {
        document.cookie = "kestrel_session=; path=/; max-age=0";
        document.cookie = "kestrel_role=; path=/; max-age=0";
        router.push("/login");
      }}
    >
      Sign out
    </button>
  );
}
