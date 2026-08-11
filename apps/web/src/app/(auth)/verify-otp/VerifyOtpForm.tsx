"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { AuthShell, AuthSuspense } from "../components/AuthShell";
import { MailPreview } from "../components/MailPreview";
import {
  clearOtpChallenge,
  nextPathFromSearch,
  readOtpChallenge,
  saveOtpChallenge,
} from "../components/auth-session";

interface OtpDelivery {
  email: string;
  expiresInSeconds: number;
  previewUrl: string | null;
  message?: string;
  devCode?: string;
}

/** Password-reset OTPs are entered on /login; redirect legacy reset links there. */
function ResetOtpRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const search = new URLSearchParams();
    search.set("intent", "forgot");
    search.set("step", "otp");
    const email = params.get("email");
    const next = params.get("next");
    if (email) search.set("email", email);
    if (next) search.set("next", next);
    router.replace(`/login?${search.toString()}`);
  }, [params, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500">
      Redirecting to password recovery…
    </div>
  );
}

function SignupVerifyFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = nextPathFromSearch(params);
  const emailFromQuery = (params.get("email") || "").trim().toLowerCase();

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | undefined>();
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const stored = readOtpChallenge();
    if (stored?.purpose === "signup" && (!emailFromQuery || stored.email === emailFromQuery)) {
      setEmail(stored.email);
      setPreviewUrl(stored.previewUrl);
      setDevCode(stored.devCode);
      setInfo(stored.message ?? null);
      return;
    }
    if (emailFromQuery) {
      setEmail(emailFromQuery);
      setInfo(`Enter the 6-digit code we emailed to ${emailFromQuery}.`);
    }
  }, [emailFromQuery]);

  const backHref = useMemo(() => {
    const q = params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : "";
    return `/register${q}`;
  }, [params]);

  function applyDelivery(result: OtpDelivery, fallbackInfo: string) {
    setPreviewUrl(result.previewUrl);
    setDevCode(result.devCode);
    setInfo(result.message || fallbackInfo);
    saveOtpChallenge({
      email: result.email,
      purpose: "signup",
      previewUrl: result.previewUrl,
      devCode: result.devCode,
      message: result.message || fallbackInfo,
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    if (!email) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/signup/verify", { email, code });
      clearOtpChallenge();
      router.replace(next);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message || "Something went wrong" : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (!email) {
      setError("Email is required to resend a code");
      return;
    }
    setError(null);
    setResending(true);
    try {
      const result = await api.post<OtpDelivery>("/api/auth/signup/resend", { email });
      applyDelivery(result, `A new code was sent to ${result.email}.`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message || "Unable to resend code" : "Unable to resend code");
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <div className="mb-8">
        <p className="ps-kicker">Email verification</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-neutral-900">Verify your email</h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          {email
            ? `Enter the 6-digit code we emailed to ${email}.`
            : "Enter the 6-digit code from your email to continue."}
        </p>
      </div>

      <div className="ps-card p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <MailPreview previewUrl={previewUrl} devCode={devCode} />

          {!emailFromQuery ? (
            <div>
              <label htmlFor="email" className="ps-label">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="ps-input"
                autoComplete="email"
                placeholder="you@company.com"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="otp" className="ps-label">
              One-time code
            </label>
            <input
              id="otp"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="ps-input tracking-[0.35em] !text-center !text-lg !font-semibold"
              autoComplete="one-time-code"
              placeholder="••••••"
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-[11px]">
            <Link href={backHref} className="font-semibold text-neutral-500 hover:text-neutral-900">
              ← Back
            </Link>
            <button
              type="button"
              disabled={resending || !email}
              className="font-semibold text-primary-500 hover:text-primary-900 disabled:opacity-60"
              onClick={() => void onResend()}
            >
              {resending ? "Resending…" : "Resend code"}
            </button>
          </div>

          {info ? (
            <p className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-2.5 text-sm text-primary-800">
              {info}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-danger/15 bg-red-50 px-3 py-2.5 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" disabled={loading} className="ps-button-primary !mt-6 w-full">
            {loading ? "Verifying…" : "Verify & create account"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-primary-500 hover:text-primary-900">
          Sign in
        </Link>
      </p>
    </>
  );
}

function VerifyOtpInner() {
  const params = useSearchParams();
  if (params.get("purpose") === "reset") {
    return <ResetOtpRedirect />;
  }

  return (
    <AuthShell variant="verify">
      <SignupVerifyFormInner />
    </AuthShell>
  );
}

export function VerifyOtpView() {
  return (
    <AuthSuspense>
      <VerifyOtpInner />
    </AuthSuspense>
  );
}
