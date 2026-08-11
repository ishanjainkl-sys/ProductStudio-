export function MailPreview({
  previewUrl,
  devCode,
}: {
  previewUrl: string | null;
  devCode?: string;
}) {
  if (!previewUrl && !devCode) return null;
  return (
    <div className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-3 text-[11px] leading-5 text-primary-800">
      <p className="font-semibold">OTP emailed via free Ethereal mailer</p>
      {previewUrl ? (
        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex font-semibold underline underline-offset-2 hover:text-primary-900"
        >
          Open inbox preview to copy the code ↗
        </a>
      ) : null}
      {devCode ? (
        <p className="mt-2 font-mono text-[12px] tracking-[0.2em]">
          Dev code: <span className="font-bold">{devCode}</span>
        </p>
      ) : null}
    </div>
  );
}
