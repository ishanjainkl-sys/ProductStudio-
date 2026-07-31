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
    <div className="min-h-screen bg-neutral-100">
      <header className="border-b border-neutral-200 bg-white px-6 py-4">
        <button className="text-xs text-neutral-500" onClick={() => router.back()}>
          ← Back
        </button>
        <h1 className="text-xl font-bold">Project Settings</h1>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex gap-2">
          {(["general", "theme"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-sm capitalize ${tab === t ? "bg-primary-500 text-white" : "bg-white"}`}
            >
              {t}
            </button>
          ))}
        </div>
        {message ? <p className="mb-4 text-sm text-emerald-600">{message}</p> : null}
        {tab === "general" ? (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <label className="block text-sm font-medium">
              Project name
              <input
                className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                className="rounded-md bg-primary-500 px-3 py-2 text-sm text-white"
                onClick={() => void saveGeneral()}
              >
                Save
              </button>
              <button
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                onClick={() => void saveAsTemplate()}
              >
                Save as Template
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Colors</h2>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {(["50", "500", "900"] as const).map((k) => (
                <label key={k} className="text-xs">
                  primary.{k}
                  <input
                    type="color"
                    className="mt-1 block h-10 w-full"
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
              className="mt-6 rounded-md bg-primary-500 px-3 py-2 text-sm text-white"
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
