"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCreateProject } from "./CreateProjectContext";
import { api, ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { PageRenderer } from "@productstudio/renderer";
import type { PageDocument } from "@productstudio/shared-types";

interface TemplateRow {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  latestVersionId: string | null;
  latestVersionNumber: number | null;
  homePageContent?: PageDocument | null;
  createdAt: string;
}

type SortOption = "newest" | "nameAsc" | "nameDesc";

export function TemplatesView() {
  const router = useRouter();
  const { triggerCreate } = useCreateProject();
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.get<TemplateRow[]>("/api/templates");
      setTemplates(Array.isArray(list) ? list : []);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 401) {
        router.replace("/login?next=/dashboard/templates");
        return;
      }
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const published = templates.filter((t) => t.latestVersionId);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const t of published) {
      if (t.category) cats.add(t.category);
    }
    return ["All", ...Array.from(cats).sort()];
  }, [published]);

  const filteredTemplates = useMemo(() => {
    let result = published.filter(t => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = category === "All" || (t.category && t.category.toLowerCase() === category.toLowerCase());

      return matchesSearch && matchesCategory;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "nameAsc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "nameDesc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

    return result;
  }, [published, searchQuery, category, sortBy]);

  return (
    <div className="mx-auto max-w-[1280px]">
      <div className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Templates</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Choose a premium template to jumpstart your next project.
          </p>
        </div>
      </div>

      {error ? <p className="mb-5 rounded-xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-sm text-danger dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">{error}</p> : null}

      {!loading && published.length > 0 && (
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/60 pb-5 ">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar flex-1 mr-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-all capitalize ${category === cat
                  ? "bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-[#1A1A1A] dark:hover:text-neutral-200"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="relative w-full sm:w-[280px]">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-200/80 bg-card pl-[38px] pr-10 py-2.5 text-[13px] font-medium text-foreground shadow-sm outline-none transition-all placeholder:text-neutral-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-neutral-800  dark:focus:border-primary-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-auto overflow-hidden rounded-xl border border-neutral-200/80 bg-card px-3 py-2.5 text-[13px] font-medium text-foreground shadow-sm outline-none transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-neutral-800 "
            >
              <option value="newest">Recently Created</option>
              <option value="nameAsc">Name A–Z</option>
              <option value="nameDesc">Name Z–A</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-[340px] animate-pulse rounded-[24px] border border-border/60 bg-card " />
          ))}
        </div>
      ) : null}

      {!loading && published.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-card px-10 py-16 text-center ">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-neutral-50 shadow-sm ring-1 ring-neutral-200/60  dark:ring-neutral-800">
            <svg className="h-6 w-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </span>
          <h2 className="mt-5 text-[16px] font-bold text-foreground">No templates yet</h2>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            Open a project&apos;s settings and choose &ldquo;Save as template&rdquo; to add reusable layouts here.
          </p>
          <button type="button" onClick={() => router.push("/dashboard")} className="mt-6 rounded-xl border border-neutral-200/80 bg-card px-5 py-2.5 text-[14px] font-bold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 dark:border-neutral-700/80  dark:text-neutral-300 dark:hover:bg-[#252525]">
            Go to projects
          </button>
        </div>
      ) : null}

      {!loading && published.length > 0 && filteredTemplates.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-card px-10 py-16 text-center ">
          <h2 className="mt-2 text-[16px] font-bold text-foreground">No matches found</h2>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            We couldn&apos;t find any templates matching your search criteria. Try modifying your search or filters.
          </p>
          <button type="button" onClick={() => { setSearchQuery(""); setCategory("All"); }} className="mt-6 font-bold text-[14px] text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Clear filters
          </button>
        </div>
      ) : null}

      {!loading && filteredTemplates.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <li
              key={template.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-neutral-200/60 bg-card shadow-sm transition-all duration-300 hover:shadow-[0_12px_24px_rgb(0,0,0,0.06)] dark:border-neutral-700/60"
            >
              {/* Clean Thumbnail Area */}
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-50 border-b border-neutral-100 dark:border-neutral-800 dark:bg-card dark:border-neutral-800/80 rounded-t-[24px]">
                {template.homePageContent ? (
                  <div className="absolute inset-0 flex items-start justify-center pointer-events-none transition-transform duration-500 will-change-transform">
                    <div className="w-[1280px] h-[720px] origin-top scale-[0.28] sm:scale-[0.32] md:scale-[0.38] lg:scale-[0.32] xl:scale-[0.27] 2xl:scale-[0.31] shrink-0 bg-card">
                      <PageRenderer document={template.homePageContent} isEditing={false} />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-start justify-center transition-transform duration-500 will-change-transform p-3 pt-6">
                    <div className="relative h-full w-[85%] overflow-hidden rounded-t-[10px] border border-neutral-200/80 bg-card p-3 shadow-sm dark:border-neutral-700/60 ">
                      <div className="mb-2.5 flex items-center gap-1.5 opacity-40">
                        <i className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                        <i className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                        <i className="h-1.5 w-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-1/3 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                        <div className="h-1.5 w-3/4 rounded-full bg-secondary" />
                        <div className="h-1.5 w-1/2 rounded-full bg-secondary" />
                      </div>
                      <div className="absolute bottom-0 left-0 h-10 w-full bg-gradient-to-t from-white to-transparent dark:from-neutral-900" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4 pb-0">
                <div className="mb-3 flex-1 flex flex-col">
                  <div className="mb-2 flex items-center justify-between gap-3 leading-none">
                    <h2 className="truncate text-[16px] font-bold text-foreground group-hover:text-primary-700 transition-colors  dark:group-hover:text-primary-400">
                      {template.name}
                    </h2>
                    {template.latestVersionNumber && (
                      <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-muted-foreground dark:bg-neutral-800 ">
                        v{template.latestVersionNumber}
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-[13px] leading-snug text-muted-foreground">
                    {template.description || "Start a new project with this pre-configured template layout."}
                  </p>

                  {template.category && (
                    <div className="mt-2.5 flex items-center">
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 capitalize">
                        {template.category}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="px-4 pb-4 pt-1">
                <Button
                  title="Use template"
                  onClick={(e) => {
                    e.stopPropagation();
                    triggerCreate({ source: "template", templateVersionId: template.latestVersionId ?? undefined, projectName: `${template.name} Site` });
                  }}
                  className="group/btn relative flex w-full h-9 items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:bg-neutral-800 active:scale-95 dark:bg-[#27272A] dark:text-white dark:hover:bg-[#3F3F46]"
                >
                  <svg className="h-3.5 w-3.5 transition-transform group-hover/btn:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Use template
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

