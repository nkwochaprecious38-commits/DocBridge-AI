"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Files, Upload, Cog, Braces, Tags, Bot, Library, Search, Workflow, ListChecks, BarChart3, Users, Settings, Menu, X, LogOut } from "lucide-react";
import { Logo } from "./Logo";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/documents", label: "Documents", icon: Files },
  { href: "/dashboard/upload", label: "Upload Documents", icon: Upload },
  { href: "/dashboard/processing", label: "Document Processing", icon: Cog },
  { href: "/dashboard/extraction", label: "Data Extraction", icon: Braces },
  { href: "/dashboard/categories", label: "Document Categories", icon: Tags },
  { href: "/dashboard/assistant", label: "AI Document Assistant", icon: Bot },
  { href: "/dashboard/knowledge", label: "Knowledge Base", icon: Library },
  { href: "/dashboard/search", label: "Search", icon: Search },
  { href: "/dashboard/workflows", label: "Workflows", icon: Workflow },
  { href: "/dashboard/tasks", label: "Tasks", icon: ListChecks },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/team", label: "Team Management", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ orgName, email }: { orgName: string; email: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav aria-label="Dashboard" className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
      {ITEMS.map((i) => {
        const active = i.href === "/dashboard" ? path === i.href : path.startsWith(i.href);
        return (
          <Link key={i.href} href={i.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>
            <i.icon className="h-4 w-4 shrink-0" />{i.label}
          </Link>
        );
      })}
    </nav>
  );
  const footer = (
    <div className="border-t border-white/10 p-4">
      <div className="truncate text-xs font-semibold text-white">{orgName}</div>
      <div className="truncate text-xs text-white/60">{email}</div>
      <form action="/auth/signout" method="post" className="mt-3">
        <button className="flex items-center gap-2 text-xs font-semibold text-aqua hover:text-white"><LogOut className="h-3.5 w-3.5" />Log Out</button>
      </form>
    </div>
  );
  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between bg-navy px-4 lg:hidden">
        <Link href="/dashboard"><Logo dark /></Link>
        <button onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} className="p-2 text-white">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="fixed inset-0 top-14 z-20 flex flex-col bg-navy lg:hidden">{nav}{footer}</div>}
      <aside className="hidden h-screen w-64 shrink-0 flex-col bg-navy lg:sticky lg:top-0 lg:flex">
        <div className="px-5 py-5"><Link href="/dashboard"><Logo dark /></Link></div>
        {nav}{footer}
      </aside>
    </>
  );
}
