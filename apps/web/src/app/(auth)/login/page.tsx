import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 via-neutral-100 to-white px-4">
      <div className="w-full max-w-md rounded-xl border border-neutral-100 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-wide text-primary-500">PRODUCTSTUDIO</p>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">Sign in</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Build production-ready sites from a governed component library.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
