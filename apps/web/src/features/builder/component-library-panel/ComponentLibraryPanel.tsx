"use client";

import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { COMPONENT_CATEGORIES } from "@productstudio/component-sdk";
import { componentRegistry } from "@productstudio/component-registry";

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
      className={`w-full rounded-md border border-neutral-100 bg-white px-3 py-2 text-left text-sm hover:border-primary-500/50 ${isDragging ? "opacity-40" : ""}`}
    >
      {name}
    </button>
  );
}

export function ComponentLibraryPanel() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const items = useMemo(() => {
    let list = query ? componentRegistry.search(query) : componentRegistry.list();
    if (category !== "all") list = list.filter((d) => d.category === category);
    return list;
  }, [query, category]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-neutral-100 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search components…"
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          <option value="all">All categories</option>
          {COMPONENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 space-y-2 overflow-auto p-3">
        {items.map((d) => (
          <LibraryItem key={d.type} type={d.type} name={d.displayName} />
        ))}
      </div>
    </div>
  );
}
