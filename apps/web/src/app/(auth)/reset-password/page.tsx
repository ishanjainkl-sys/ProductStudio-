"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSuspense } from "../components/AuthShell";

/** Password reset steps now live on /login — keep this route as a thin redirect. */
function ResetRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const search = new URLSearchParams();
    search.set("intent", "forgot");
    search.set("step", "reset");
    const email = params.get("email");
    const next = params.get("next");
    if (email) search.set("email", email);
    if (next) search.set("next", next);
    router.replace(`/login?${search.toString()}`);
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">
      Redirecting to password reset…
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthSuspense>
      <ResetRedirect />
    </AuthSuspense>
  );
}
