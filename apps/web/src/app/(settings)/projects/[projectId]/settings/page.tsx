"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import type { ThemeTokens } from "@productstudio/shared-types";

export default function SettingsPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const projectId = params.projectId;
  const [tab, setTab] = useState<"general" | "theme">("theme");
  const [name, setName] = useState("");
  const [tokens, setTokens] = useState<ThemeTokens | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [settings, theme] = await Promise.all([
        api.get<{ name: string }>(`/api/projects/${projectId}/settings`),
        api.get<{ tokens: ThemeTokens }>(`/api/projects/${projectId}/theme`),
      ]);
      setName(settings.name);
      setTokens(theme.tokens);
    })();
  }, [projectId]);

  async function saveTheme() {
    if (!tokens) return;
    await api.patch(`/api/projects/${projectId}/theme`, { tokens });
    setMessage("Theme saved");
  }

  async function saveGeneral() {
    await api.patch(`/api/projects/${projectId}/settings`, { name });
    setMessage("Settings saved");
  }

  async function saveAsTemplate() {
    const templateName = window.prompt("Template name", `${name} Template`);
    if (!templateName) return;
    await api.post(`/api/projects/${projectId}/save-as-template`, {
      name: templateName,
      category: "marketing",
    });
    setMessage("Template created");
  }

  if (!tokens) return <div className="p-8 text-sm text-neutral-500">Loading settings…</div>;

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-[#0A0A0A] text-foreground font-sans">
      <header className="border-b border-neutral-200 dark:border-white/5 bg-white dark:bg-[#111111] px-6 py-4">
        <button className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white transition-colors flex items-center gap-1" onClick={() => router.back()}>
          ← Back
        </button>
        <h1 className="text-xl font-bold mt-2">Project Settings</h1>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex gap-2">
          {(["general", "theme"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize tracking-wide transition-colors ${tab === t ? "bg-primary-600 text-white shadow-sm" : "bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:bg-white/5 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white border border-transparent dark:border-white/5"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {message ? <p className="mb-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">{message}</p> : null}
        {tab === "general" ? (
          <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#111111]">
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100">
              Project name
              <input
                className="mt-1.5 w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="mt-6 flex gap-3">
              <button
                className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
                onClick={() => void saveGeneral()}
              >
                Save
              </button>
              <button
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white"
                onClick={() => void saveAsTemplate()}
              >
                Save as Template
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#111111]">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Colors</h2>
            <div className="mt-4 grid grid-cols-3 gap-4">
              {(["50", "500", "900"] as const).map((k) => (
                <label key={k} className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  primary.{k}
                  <input
                    type="color"
                    className="mt-1.5 block h-12 w-full cursor-pointer rounded-md border border-neutral-200 p-0 shadow-sm dark:border-white/5 bg-transparent"
                    value={tokens.color.primary[k]}
                    onChange={(e) =>
                      setTokens({
                        ...tokens,
                        color: {
                          ...tokens.color,
                          primary: { ...tokens.color.primary, [k]: e.target.value },
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <button
              className="mt-8 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700"
              onClick={() => void saveTheme()}
            >
              Save theme
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
