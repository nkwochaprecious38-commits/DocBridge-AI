import Link from "next/link";
import { Logo } from "@/components/Logo";
import { supabaseConfigured } from "@/lib/supabase/env";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-mist">
      <div className="container-x flex h-16 items-center"><Link href="/" aria-label="DocBridge home"><Logo /></Link></div>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 pt-6 sm:pt-12">
        <div className="w-full max-w-md">
          {!supabaseConfigured && (
            <div role="alert" className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Authentication is not configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment to enable sign up and log in.
            </div>
          )}
          <div className="card p-7 sm:p-8">{children}</div>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-navy/60">© 2026 DocBridge</footer>
    </div>
  );
}
