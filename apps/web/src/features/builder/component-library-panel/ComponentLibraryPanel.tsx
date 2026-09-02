"use client";

import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { COMPONENT_CATEGORIES } from "@productstudio/component-sdk";
import { componentRegistry } from "@productstudio/component-registry";
import {
  Search,
  Grid2X2,
  Box,
  LayoutTemplate,
  Megaphone,
  Briefcase,
  Navigation,
  ListChecks,
  Wrench,
  ArrowLeft,
  X
} from "lucide-react";

function LibraryItem({ type, name }: { type: string; name: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `library:${type}`,
    data: { type: "library-item", componentType: type },
  });

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`relative w-full overflow-hidden rounded-md border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#1C1C1C] px-3 py-2 text-left text-[12px] text-foreground shadow-sm hover:border-primary-500/50 hover:shadow-md dark:hover:border-primary-500/50 transition-all group ${isDragging ? "opacity-40 scale-95" : ""}`}
      aria-label={`Add ${name} component`}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-500 group-hover:bg-primary-50 group-hover:text-primary-600 dark:bg-[#2A2A2A] dark:text-neutral-400 dark:group-hover:bg-primary-500/20 dark:group-hover:text-primary-400">
          <Box className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <span className="font-medium group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{name}</span>
      </div>
    </button>
  );
}

const CATEGORY_STYLES: Record<string, { icon: React.ElementType, bg: string, color: string }> = {
  basic: { icon: Box, bg: "bg-purple-500/10 dark:bg-purple-500/20", color: "text-purple-600 dark:text-purple-400" },
  layout: { icon: LayoutTemplate, bg: "bg-green-500/10 dark:bg-green-500/20", color: "text-green-600 dark:text-green-400" },
  marketing: { icon: Megaphone, bg: "bg-orange-500/10 dark:bg-orange-500/20", color: "text-orange-600 dark:text-orange-400" },
  business: { icon: Briefcase, bg: "bg-indigo-500/10 dark:bg-indigo-500/20", color: "text-indigo-600 dark:text-indigo-400" },
  navigation: { icon: Navigation, bg: "bg-pink-500/10 dark:bg-pink-500/20", color: "text-pink-600 dark:text-pink-400" },
  forms: { icon: ListChecks, bg: "bg-yellow-500/10 dark:bg-yellow-500/20", color: "text-yellow-600 dark:text-yellow-400" },
  utility: { icon: Wrench, bg: "bg-teal-500/10 dark:bg-teal-500/20", color: "text-teal-600 dark:text-teal-400" },
};

export function ComponentLibraryPanel() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const isSearchActive = query.trim().length > 0;

  const items = useMemo(() => {
    let list = componentRegistry.list();
    if (isSearchActive) {
      list = componentRegistry.search(query);
    }
    if (activeCategory) {
      list = list.filter((d) => d.category === activeCategory);
    }
    return list;
  }, [query, activeCategory, isSearchActive]);

  const handleClearSearch = () => setQuery("");

  const handleBack = () => {
    setActiveCategory(null);
    setQuery("");
  };

  return (
    <div
      className="flex h-full flex-col bg-white dark:bg-[#111]"
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Header Area */}
      <div className="flex-none p-2 border-b border-neutral-100 dark:border-white/5 space-y-2">
        {activeCategory && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:text-foreground dark:text-neutral-400 dark:hover:text-neutral-200"
            aria-label="Back to all categories"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            <span className="capitalize">{activeCategory}</span>
          </button>
        )}

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={activeCategory ? `Search in ${activeCategory}...` : "Search components"}
            className="w-full rounded-[4px] border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-black/20 py-1 pl-7 pr-7 text-[12px] h-7 text-foreground focus:border-primary-500 focus:bg-white dark:focus:bg-[#111] focus:outline-none transition-colors"
            aria-label="Search components"
          />
          {isSearchActive && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[2px] p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {!activeCategory && !isSearchActive ? (
          // Main Categories View
          <div className="p-2">
            <div className="grid grid-cols-2 gap-1.5">
              {COMPONENT_CATEGORIES.map((c) => {
                const style = CATEGORY_STYLES[c] || { icon: Box, bg: "bg-neutral-500/10", color: "text-neutral-500" };
                const Icon = style.icon;

                return (
                  <button
                    key={c}
                    onClick={() => setActiveCategory(c)}
                    className="group flex flex-col items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 p-2 transition-all hover:border-neutral-200 hover:bg-neutral-100 hover:shadow-sm dark:border-white/5 dark:bg-[#161616] dark:hover:border-white/10 dark:hover:bg-white/5"
                    aria-label={`Browse ${c} components`}
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-[6px] bg-white shadow-sm dark:bg-[#222] ${style.color}`}>
                      <Icon className="h-4 w-4 opacity-80 transition-transform group-hover:scale-110 group-hover:opacity-100" />
                    </div>
                    <span className="text-center text-[10px] font-medium capitalize text-neutral-700 dark:text-neutral-300">
                      {c}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // Drill-down or Global Search View
          <div className="p-2 space-y-3">
            {isSearchActive && (
              <h3 className="px-1 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                {items.length} result{items.length !== 1 ? 's' : ''} found
              </h3>
            )}

            <div className="grid grid-cols-1 gap-1.5">
              {items.map((d) => (
                <LibraryItem key={d.type} type={d.type} name={d.displayName} />
              ))}

              {items.length === 0 && (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 dark:bg-white/5">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                  <p className="text-[12px] font-medium text-neutral-600 dark:text-neutral-300">No matching components</p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">Try adjusting your search terms</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
