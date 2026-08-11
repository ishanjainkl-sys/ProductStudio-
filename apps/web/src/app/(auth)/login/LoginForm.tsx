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
import { nextPathFromSearch } from "../components/auth-session";

function LoginFormInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = nextPathFromSearch(params);

  const [email, setEmail] = useState("designer@productstudio.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/login", { email, password });
      router.replace(next);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError("Invalid email or password");
      } else {
        setError("Unable to sign in");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <MotionReveal className="mb-8">
        <p className="ps-kicker">Welcome back</p>
        <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-neutral-900 dark:text-neutral-50">
          Sign in to your account
        </h2>
        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Enter your details below to access your workspace.
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href={`/forgot-password${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`}
                  className="text-[12px] font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
                autoComplete="current-password"
                placeholder="At least 8 characters"
              />
            </div>

            {error ? (
              <p className="rounded-lg border border-danger/15 bg-red-50 px-3 py-2.5 text-sm text-danger dark:bg-red-950/30 dark:border-red-900/50" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={loading} className="!mt-6 w-full">
              {loading ? "Signing in…" : "Sign in"}
            </Button>

            <SocialAuthButtons />
          </form>
        </Card>
      </MotionReveal>

      <MotionReveal delay={0.14}>
        <p className="mt-6 text-center text-sm text-neutral-500">
          Don&apos;t have an account?{" "}
          <Link
            href={`/register${params.get("next") ? `?next=${encodeURIComponent(params.get("next")!)}` : ""}`}
            className="font-semibold text-primary-500 hover:text-primary-600 dark:hover:text-primary-400"
          >
            Sign up
          </Link>
        </p>
      </MotionReveal>
    </>
  );
}

export function LoginView() {
  return (
    <AuthSuspense>
      <AuthShell variant="login">
        <LoginFormInner />
      </AuthShell>
    </AuthSuspense>
  );
}

