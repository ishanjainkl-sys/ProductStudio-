"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSuspense } from "../components/AuthShell";

/** Forgot/reset now lives on /login — keep this route as a thin redirect. */
function ForgotRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const search = new URLSearchParams();
    search.set("intent", "forgot");
    const email = params.get("email");
    const next = params.get("next");
    const step = params.get("step");
    if (email) search.set("email", email);
    if (next) search.set("next", next);
    if (step === "otp" || step === "reset") search.set("step", step);
    router.replace(`/login?${search.toString()}`);
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">
      Redirecting to password recovery…
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthSuspense>
      <ForgotRedirect />
    </AuthSuspense>
  );
}
