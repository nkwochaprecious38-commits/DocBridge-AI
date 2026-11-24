"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { Alert, Field, PasswordInput, passwordProblem } from "@/components/AuthParts";

export default function Reset() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return setReady(false);
    createClient().auth.getSession().then(({ data }) => setReady(!!data.session));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const p = passwordProblem(pw);
    if (p) return setErr(p);
    if (pw !== confirm) return setErr("Passwords do not match.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { setBusy(false); return setErr(error.message); }
    await supabase.auth.signOut();
    router.push("/login?reset=1");
  }
  if (ready === null) return <p className="text-sm text-navy/70">Checking your reset link</p>;
  if (!ready) return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Reset link not valid</h1>
      <Alert kind="error">This link is invalid or has expired. Request a new one.</Alert>
      <Link href="/forgot-password" className="btn-primary w-full">Request New Link</Link></div>
  );
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div><h1 className="text-2xl font-bold">Choose a new password</h1></div>
      {err && <Alert kind="error">{err}</Alert>}
      <Field id="pw" label="New password"><PasswordInput id="pw" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
      <Field id="confirm" label="Confirm new password"><PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Saving" : "Update Password"}</button>
    </form>
  );
}
