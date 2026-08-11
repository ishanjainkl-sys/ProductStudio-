"use client";

import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export interface InitialCreateOptions {
  source?: "blank" | "template";
  templateVersionId?: string;
  projectName?: string;
}

interface CreateProjectContextValue {
  registerHandler: (handler: ((options?: InitialCreateOptions) => void) | null) => void;
  triggerCreate: (options?: InitialCreateOptions) => void;
}

const CreateProjectContext = createContext<CreateProjectContextValue | null>(null);

export function CreateProjectProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const handlerRef = useRef<((options?: InitialCreateOptions) => void) | null>(null);

  const registerHandler = useCallback((handler: ((options?: InitialCreateOptions) => void) | null) => {
    handlerRef.current = handler;
  }, []);

  const triggerCreate = useCallback((options?: InitialCreateOptions) => {
    if (handlerRef.current) {
      handlerRef.current(options);
      return;
    }
    const params = new URLSearchParams([["new", "1"]]);
    if (options?.templateVersionId) params.set("templateId", options.templateVersionId);
    if (options?.projectName) params.set("name", options.projectName);
    router.push(`/dashboard?${params.toString()}`);
  }, [router]);

  const value = useMemo(
    () => ({ registerHandler, triggerCreate }),
    [registerHandler, triggerCreate],
  );

  return <CreateProjectContext.Provider value={value}>{children}</CreateProjectContext.Provider>;
}

export function useCreateProject() {
  const ctx = useContext(CreateProjectContext);
  if (!ctx) {
    throw new Error("useCreateProject must be used within CreateProjectProvider");
  }
  return ctx;
}
