import { PublicLogo } from "./PublicLogo";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#e4e0da] dark:border-neutral-800/80 px-5 py-8 lg:px-8">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-4 sm:items-start">
          <PublicLogo />
          <p className="text-xs text-[#8a857e] dark:text-neutral-500 text-center sm:text-left max-w-xs">
            The next generation visual builder for creating stunning web applications.
          </p>
        </div>
        <div className="flex flex-wrap justify-center sm:justify-end gap-x-12 gap-y-8">
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-sm text-foreground">Product</h4>
            <a href="/dashboard" className="text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Projects</a>
            <a href="/dashboard/templates" className="text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Templates</a>
            <a href="/dashboard/account" className="text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Settings</a>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="font-semibold text-sm text-foreground">Company</h4>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Blog</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact</a>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-[1240px] mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center text-xs text-[#8a857e] dark:text-neutral-500">
        <p>© 2026 ProductStudio. Build beautifully.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
