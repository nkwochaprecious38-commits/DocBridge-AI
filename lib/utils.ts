export const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "None";
export const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "None";
export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(2)} GB`;
}
export const STATUS_LABEL: Record<string, string> = {
  uploaded: "Uploaded", processing: "Processing", processed: "Processed",
  awaiting_review: "Awaiting Review", approved: "Approved", failed: "Failed",
};
export const STATUS_STYLE: Record<string, string> = {
  uploaded: "bg-slate-100 text-slate-700",
  processing: "bg-blue-50 text-blue-700",
  processed: "bg-teal/10 text-teal",
  awaiting_review: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
};
export const ALLOWED_EXT = ["pdf","docx","doc","xlsx","xls","pptx","ppt","txt","csv","png","jpg","jpeg"];
