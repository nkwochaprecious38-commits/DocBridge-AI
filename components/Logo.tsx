// Placeholder mark. Replace this component (and public/logo.svg) with the final approved logo.
export function LogoMark({ className = "h-8 w-8", dark = false }: { className?: string; dark?: boolean }) {
  const base = dark ? "#FFFFFF" : "#142B4A";
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="4" y="8" width="11" height="24" rx="2.5" fill={base} />
      <rect x="25" y="8" width="11" height="24" rx="2.5" fill="#2463EB" />
      <path d="M15 20h10" stroke="#16A6A1" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark dark={dark} />
      <span className={`font-heading text-xl font-extrabold tracking-tight ${dark ? "text-white" : "text-navy"}`}>DocBridge</span>
    </span>
  );
}
