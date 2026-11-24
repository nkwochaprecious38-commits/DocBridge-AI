"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { supabaseConfigured } from "@/lib/supabase/env";
import { Alert, EMAIL_RE, Field, PasswordInput, safeNext } from "@/components/AuthParts";

const URL_ERRORS: Record<string, string> = {
  not_configured: "Authentication is not configured on this deployment.",
  callback: "That verification link is invalid or has expired. Request a new one by logging in.",
  no_workspace: "No workspace was found for this account.",
};

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState(URL_ERRORS[sp.get("error") ?? ""] ?? "");
  const [info, setInfo] = useState(sp.get("reset") ? "Your password was updated. Log in with your new password." : "");
  const [unverified, setUnverified] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(""); setInfo(""); setUnverified(false);
    const err: Record<string, string> = {};
    if (!EMAIL_RE.test(email)) err.email = "Enter a valid email address.";
    if (!password) err.password = "Enter your password.";
    setErrors(err);
    if (Object.keys(err).length) return;
    if (!supabaseConfigured) return setFormError(URL_ERRORS.not_configured);
    setBusy(true);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setBusy(false);
      if (/confirm/i.test(error.message)) { setUnverified(true); return setFormError("Your email address has not been verified yet. Check your inbox for the verification link."); }
      return setFormError(error.message === "Invalid login credentials" ? "The email or password is incorrect." : error.message);
    }
    router.push(safeNext(sp.get("next")));
    router.refresh();
  }

  async function resend() {
    const { error } = await createClient().auth.resend({ type: "signup", email: email.trim() });
    setInfo(error ? "" : "Verification email sent."); if (error) setFormError(error.message);
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div><h1 className="text-2xl font-bold">Log in to DocBridge</h1><p className="mt-1 text-sm text-navy/70">Welcome back. Enter your details to continue.</p></div>
      {formError && <Alert kind="error">{formError}</Alert>}
      {info && <Alert kind="success">{info}</Alert>}
      {unverified && <button type="button" onClick={resend} className="btn-secondary btn-sm">Resend verification email</button>}
      <Field id="email" label="Email" error={errors.email}><input id="email" type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} /></Field>
      <Field id="password" label="Password" error={errors.password}><PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} /></Field>
      <div className="text-right"><Link href="/forgot-password" className="text-sm font-semibold text-brand">Forgot password?</Link></div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Logging in" : "Log In"}</button>
      <p className="text-center text-sm text-navy/70">New to DocBridge? <Link href="/signup" className="font-semibold text-brand">Create an account</Link></p>
    </form>
  );
}
export default function Login() { return <Suspense><LoginForm /></Suspense>; }
