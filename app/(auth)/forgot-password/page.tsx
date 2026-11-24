"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { Alert, EMAIL_RE, Field } from "@/components/AuthParts";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!EMAIL_RE.test(email)) return setErr("Enter a valid email address.");
    if (!supabaseConfigured) return setErr("Authentication is not configured on this deployment.");
    setBusy(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(true);
  }
  if (done) return (
    <div className="space-y-4"><h1 className="text-2xl font-bold">Check your email</h1>
      <Alert kind="success">If an account exists for {email}, a password reset link is on its way.</Alert>
      <Link href="/login" className="btn-secondary w-full">Back to Log In</Link></div>
  );
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div><h1 className="text-2xl font-bold">Reset your password</h1><p className="mt-1 text-sm text-navy/70">Enter your email and we will send a reset link.</p></div>
      {err && <Alert kind="error">{err}</Alert>}
      <Field id="email" label="Email"><input id="email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Sending" : "Send Reset Link"}</button>
      <p className="text-center text-sm"><Link href="/login" className="font-semibold text-brand">Back to Log In</Link></p>
    </form>
  );
}
