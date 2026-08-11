import Link from "next/link";

export function PublicLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="ProductStudio home">
      <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#131313] dark:bg-white text-white dark:text-[#131313] shadow-sm">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M4 4h7.2a4.3 4.3 0 0 1 0 8.6H8.1V16H4V4Z" fill="currentColor" />
          <path d="M8.1 8h3a.6.6 0 1 1 0 1.2h-3V8Z" className="fill-[#131313] dark:fill-white" />
        </svg>
      </span>
      <span className="text-[17px] font-bold tracking-[-0.035em] text-[#171717] dark:text-white">ProductStudio</span>
    </Link>
  );
}
