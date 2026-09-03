"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCreateProject } from "./CreateProjectContext";
import { api, ApiClientError } from "@/lib/api-client";
import { PreviewCard } from "./PreviewCard";
import { Button } from "@/components/ui/button";
import { PageRenderer } from "@productstudio/renderer";
import type { PageDocument } from "@productstudio/shared-types";
import { Search, X, LayoutTemplate, Plus } from "lucide-react";

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
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-[16px] font-semibold text-foreground">Templates</h1>
        </div>
      </div>

      {error ? <p className="mb-5 rounded-xl border border-red-200/50 bg-red-50/50 px-4 py-3 text-sm text-danger dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">{error}</p> : null}

      {!loading && published.length > 0 && (
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar flex-1 mr-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium transition-all capitalize ${category === cat
                  ? "bg-neutral-900 text-white shadow-none dark:bg-white dark:text-neutral-900"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-[#1A1A1A] dark:hover:text-neutral-200"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <div className="relative w-full sm:w-[240px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <Search className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-neutral-200/80 bg-transparent pl-8 pr-8 h-7 text-[12px] font-medium text-foreground shadow-none outline-none transition-all placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 dark:border-neutral-800  dark:focus:border-primary-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  <X className="h-3 w-3" strokeWidth={2} />
                </button>
              )}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full sm:w-auto h-7 overflow-hidden rounded-md border border-neutral-200/80 bg-transparent px-2.5 text-[12px] font-medium text-foreground shadow-none outline-none transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 dark:border-neutral-800 "
            >
              <option value="newest">Recently Created</option>
              <option value="nameAsc">Name A–Z</option>
              <option value="nameDesc">Name Z–A</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="h-[340px] animate-pulse rounded-[24px] border border-border/60 bg-card " />
          ))}
        </div>
      ) : null}

      {!loading && published.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-card px-10 py-16 text-center ">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-neutral-50 shadow-sm ring-1 ring-neutral-200/60  dark:ring-neutral-800">
            <LayoutTemplate className="h-6 w-6 text-neutral-400" strokeWidth={1.5} />
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
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredTemplates.map((template, index) => (
            <li
              key={template.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-lg border border-neutral-200/60 bg-card shadow-sm transition-all duration-300 hover:shadow-[0_12px_24px_rgb(0,0,0,0.06)] dark:border-neutral-700/60 hover:-translate-y-1"
            >
              {/* Clean Thumbnail Area */}
              <PreviewCard
                homePageContent={template.homePageContent}
                overlayButtonText="Use template"
                overlayButtonIcon={<Plus className="h-3.5 w-3.5 mr-1.5 inline-block" strokeWidth={2.5} />}
                onClick={(e) => {
                  e.stopPropagation();
                  triggerCreate({ source: "template", templateVersionId: template.latestVersionId ?? undefined, projectName: `${template.name} Site` });
                }}
              />

              <div className="flex flex-1 flex-col p-3 pb-2">
                <div className="mb-3 flex-1 flex flex-col">
                  <div className="mb-2 flex items-center justify-between gap-3 leading-none">
                    <h2 className="truncate text-[12px] font-medium text-foreground group-hover:text-primary-700 transition-colors dark:group-hover:text-primary-400">
                      {template.name}
                    </h2>
                    {template.latestVersionNumber ? (
                      <span className="shrink-0 rounded-md bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground dark:bg-neutral-800">
                        v{template.latestVersionNumber}
                      </span>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                    {template.description || "Start a new project with this pre-configured template layout. Fully customizable."}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 uppercase tracking-widest leading-none">
                      {template.category || "General"}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

