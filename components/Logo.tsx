// Official DocBridge AI mark (public/logo-mark.png, transparent). Text is live so it works on light and dark backgrounds.
export function LogoMark({ className = "h-9 w-9" }: { className?: string; dark?: boolean }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo-mark.png" alt="" aria-hidden="true" className={`${className} object-contain`} />;
}
export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`font-heading text-xl font-extrabold tracking-tight ${dark ? "text-white" : "text-navy"}`}>DocBridge AI</span>
    </span>
  );
}
