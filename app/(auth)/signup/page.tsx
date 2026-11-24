"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { Alert, EMAIL_RE, Field, PasswordInput, passwordProblem } from "@/components/AuthParts";

export default function SignUp() {
  const [f, setF] = useState({ name: "", org: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const err: Record<string, string> = {};
    if (!f.name.trim()) err.name = "Enter your full name.";
    if (!EMAIL_RE.test(f.email)) err.email = "Enter a valid email address.";
    const pp = passwordProblem(f.password);
    if (pp) err.password = pp;
    if (f.confirm !== f.password) err.confirm = "Passwords do not match.";
    setErrors(err);
    if (Object.keys(err).length) return;
    if (!supabaseConfigured) return setFormError("Authentication is not configured on this deployment.");
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(), password: f.password,
      options: { data: { full_name: f.name.trim(), org_name: f.org.trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    setBusy(false);
    if (error) return setFormError(error.message);
    // Supabase returns a user with no identities when the email is already registered.
    if (data.user && data.user.identities?.length === 0) return setFormError("An account with this email already exists. Try logging in instead.");
    if (data.session) { window.location.assign("/dashboard"); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <Alert kind="success">We sent a verification link to <strong>{f.email}</strong>. Open it to activate your account, then log in.</Alert>
        <Link href="/login" className="btn-primary w-full">Go to Log In</Link>
      </div>
    );
  }
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div><h1 className="text-2xl font-bold">Create your account</h1><p className="mt-1 text-sm text-navy/70">Start organizing your documents in a secure workspace.</p></div>
      {formError && <Alert kind="error">{formError}</Alert>}
      <Field id="name" label="Full name" error={errors.name}><input id="name" className="input" autoComplete="name" value={f.name} onChange={set("name")} aria-invalid={!!errors.name} /></Field>
      <Field id="org" label="Organization name (optional)"><input id="org" className="input" autoComplete="organization" value={f.org} onChange={set("org")} /></Field>
      <Field id="email" label="Work email" error={errors.email}><input id="email" type="email" className="input" autoComplete="email" value={f.email} onChange={set("email")} aria-invalid={!!errors.email} /></Field>
      <Field id="password" label="Password" error={errors.password}><PasswordInput id="password" autoComplete="new-password" value={f.password} onChange={set("password")} aria-invalid={!!errors.password} /></Field>
      <Field id="confirm" label="Confirm password" error={errors.confirm}><PasswordInput id="confirm" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} aria-invalid={!!errors.confirm} /></Field>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Creating account" : "Create Account"}</button>
      <p className="text-center text-sm text-navy/70">Already have an account? <Link href="/login" className="font-semibold text-brand">Log In</Link></p>
    </form>
  );
}
