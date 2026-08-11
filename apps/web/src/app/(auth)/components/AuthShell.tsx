import { ReactNode, Suspense } from "react";
import Link from "next/link";

export type AuthShellVariant = "login" | "register" | "forgot" | "verify" | "reset";

const COPY: Record<
  AuthShellVariant,
  { headline: ReactNode; description: string }
> = {
  login: {
    headline: (
      <>
        Design intent.
        <br />
        Production output.
        <br />
        <span className="text-primary-300">One source of truth.</span>
      </>
    ),
    description:
      "Assemble governed components visually and ship clean, deterministic code with confidence.",
  },
  register: {
    headline: (
      <>
        Start building.
        <br />
        Ship with confidence.
        <br />
        <span className="text-primary-300">Join your team.</span>
      </>
    ),
    description:
      "Create your workspace account and assemble production-ready sites from a governed component library.",
  },
  forgot: {
    headline: (
      <>
        Recover access.
        <br />
        Stay in control.
        <br />
        <span className="text-primary-300">Secure by default.</span>
      </>
    ),
    description:
      "Use a one-time email code to reset your password and get back to your workspace.",
  },
  verify: {
    headline: (
      <>
        Confirm it&apos;s you.
        <br />
        One code.
        <br />
        <span className="text-primary-300">Verified access.</span>
      </>
    ),
    description:
      "Enter the 6-digit code from your email to continue. Codes expire in 10 minutes.",
  },
  reset: {
    headline: (
      <>
        Choose a new password.
        <br />
        Lock it in.
        <br />
        <span className="text-primary-300">Back to work.</span>
      </>
    ),
    description: "Set a strong password for your ProductStudio workspace and sign back in securely.",
  },
};

export function AuthShell({
  variant,
  children,
}: {
  variant: AuthShellVariant;
  children: ReactNode;
}) {
  const copy = COPY[variant];

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_0.95fr] dark:bg-[#0A0A0A]">
      <aside className="relative hidden overflow-hidden bg-primary-900 p-12 text-white lg:flex lg:flex-col dark:bg-[#111111] dark:border-r border-neutral-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,111,240,0.42),transparent_38%),radial-gradient(circle_at_85%_85%,rgba(147,181,255,0.18),transparent_36%)] dark:opacity-40" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.45)_1px,transparent_1px)] [background-size:48px_48px]" />
        <Link href="/" className="relative z-10 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-bold text-primary-900">
            P
          </span>
          <span className="text-lg font-bold tracking-[-0.03em] text-white">ProductStudio</span>
        </Link>
        <div className="relative z-10 my-auto max-w-xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-200">
            Enterprise website builder
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.03] tracking-[-0.055em] xl:text-6xl text-white">
            {copy.headline}
          </h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-white/60">{copy.description}</p>
        </div>
        <div className="relative z-10 flex items-center gap-6 text-xs text-white/45">
          <span>Component-first</span>
          <span>JSON-driven</span>
          <span>OTP verified</span>
        </div>
      </aside>

      <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 py-12 sm:px-10 dark:bg-[#0A0A0A]">
        <div className="w-full max-w-[430px]">
          <Link href="/" className="mb-12 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-500 text-sm font-bold text-white">
              P
            </span>
            <span className="text-lg font-bold tracking-[-0.03em] text-foreground">ProductStudio</span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}

export function AuthPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 text-sm text-neutral-500 dark:bg-[#0A0A0A]">
      Loading…
    </div>
  );
}

export function AuthSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<AuthPageFallback />}>{children}</Suspense>;
}
