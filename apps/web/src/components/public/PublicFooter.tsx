import { PublicLogo } from "./PublicLogo";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#e4e0da] dark:border-neutral-800/80 px-5 py-8 lg:px-8">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-5 sm:flex-row">
        <PublicLogo />
        <p className="text-xs text-[#8a857e] dark:text-neutral-500">© 2026 ProductStudio. Build beautifully.</p>
      </div>
    </footer>
  );
}
