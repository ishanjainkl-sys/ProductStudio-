"use client";

import { PageRenderer } from "@productstudio/renderer";
import { BREAKPOINT_WIDTHS } from "@productstudio/shared-types";
import { useBuilderStore } from "../state/builder-store";
import { Selectable } from "./Selectable";

export function Canvas() {
  const page = useBuilderStore((s) => s.page);
  const theme = useBuilderStore((s) => s.theme);
  const breakpoint = useBuilderStore((s) => s.activeBreakpoint);
  const selectNode = useBuilderStore((s) => s.selectNode);

  if (!page) {
    return <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">Loading canvas…</div>;
  }

  const width = BREAKPOINT_WIDTHS[breakpoint];

  return (
    <div
      className="flex flex-1 justify-center overflow-auto bg-[linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:16px_16px] p-8"
      onClick={() => selectNode(null)}
    >
      <div
        className="min-h-[80vh] bg-white shadow-md"
        style={{ width, maxWidth: "100%", transition: "width 150ms ease" }}
      >
        <PageRenderer
          document={page}
          breakpoint={breakpoint}
          isEditing
          theme={theme}
          wrapNode={(node, element) => <Selectable node={node}>{element}</Selectable>}
        />
      </div>
    </div>
  );
}
