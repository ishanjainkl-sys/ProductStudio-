"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiClientError } from "@/lib/api-client";
import { AuthShell, AuthSuspense } from "../components/AuthShell";
import { SocialAuthButtons } from "../components/SocialAuthButtons";
import { MotionReveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nextPathFromSearch, saveOtpChallenge } from "../components/auth-session";

interface OtpDelivery {
  email: string;
  expiresInSeconds: number;
  previewUrl: string | null;
  message?: string;
  devCode?: string;
}

function RegisterFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = nextPathFromSearch(params);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await api.post<OtpDelivery>("/api/auth/signup/start", {
        email,
        password,
        confirmPassword,
      });

      saveOtpChallenge({
        email: result.email,
        purpose: "signup",
        previewUrl: result.previewUrl,
        devCode: result.devCode,
        message: result.message || `We sent a 6-digit code to ${result.email}.`,
      });

      const search = new URLSearchParams({
        purpose: "signup",
        email: result.email,
        next,
      });
      router.push(`/verify-otp?${search.toString()}`);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message || "Something went wrong" : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <MotionReveal className="mb-8">
        <p className="ps-kicker">Get started</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-neutral-900">
          Create your account
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Set up access in a minute and start your first project.
        </p>
      </MotionReveal>

      <MotionReveal delay={0.08}>
      <Card className="p-6 sm:p-8">
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div>
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
              autoComplete="email"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5"
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <p className="mt-1.5 text-[11px] text-neutral-400">Use at least 8 characters.</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1.5"
              autoComplete="new-password"
              placeholder="Re-enter your password"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-danger/15 bg-red-50 px-3 py-2.5 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={loading} className="!mt-6 w-full">
            {loading ? "Sending code…" : "Continue with email"}
          </Button>

          <SocialAuthButtons />

          <p className="text-center text-[11px] leading-5 text-neutral-400">
            We&apos;ll email a one-time code to verify your address before creating the account.
          </p>
        </form>
      </Card>
      </MotionReveal>

      <MotionReveal delay={0.14}>
      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          href={`/login${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`}
          className="font-semibold text-primary-500 hover:text-primary-900"
        >
          Sign in
        </Link>
      </p>
      </MotionReveal>
    </>
  );
}

export function RegisterView() {
  return (
    <AuthSuspense>
      <AuthShell variant="register">
        <RegisterFormInner />
      </AuthShell>
    </AuthSuspense>
  );
}
