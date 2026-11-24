import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Selar does not publish a stable payload schema we could verify, so fields are read defensively
// and every delivery is recorded in app_private.selar_events for inspection.
const dig = (o: any, keys: string[]): any => {
  for (const k of keys) {
    const v = k.split(".").reduce((a, p) => (a && typeof a === "object" ? a[p] : undefined), o);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
};

function detectPlan(p: any): "starter" | "professional" | "enterprise" | null {
  const blob = JSON.stringify(p).toLowerCase();
  if (/47plan/.test(blob)) return "starter";
  if (/57plan/.test(blob)) return "professional";
  if (/97plan/.test(blob)) return "enterprise";
  const amount = Number(dig(p, ["amount", "price", "total", "data.amount", "data.price", "product_price", "data.product.price"]));
  if (amount === 47) return "starter";
  if (amount === 57) return "professional";
  if (amount === 97) return "enterprise";
  if (/enterprise/.test(blob)) return "enterprise";
  if (/professional/.test(blob)) return "professional";
  if (/starter/.test(blob)) return "starter";
  return null;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret") ?? req.headers.get("x-webhook-secret") ?? "";
  const ct = req.headers.get("content-type") ?? "";
  let payload: any = {};
  try {
    payload = ct.includes("json") ? await req.json() : Object.fromEntries(new URLSearchParams(await req.text()));
  } catch { return NextResponse.json({ error: "Unreadable body" }, { status: 400 }); }

  const email = dig(payload, ["customer_email", "buyer_email", "email", "customer.email", "buyer.email", "data.customer_email", "data.customer.email", "data.email", "data.buyer.email"]);
  const reference = String(dig(payload, ["reference", "order_id", "transaction_id", "id", "subscription_code", "data.reference", "data.id", "data.order_id"]) ?? "");
  const event = String(dig(payload, ["event", "type", "status", "data.status"]) ?? "").toLowerCase();
  const status = /cancel|expire|refund|fail|disable/.test(event) ? "cancelled" : "active";

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("record_selar_payment", {
    p_secret: secret, p_email: email ? String(email) : null, p_plan: detectPlan(payload), p_status: status, p_reference: reference || null, p_payload: payload,
  });
  if (error) return NextResponse.json({ error: "Could not record payment" }, { status: 500 });
  if (data === "unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Always 200 for authorized deliveries so Selar does not retry unmatched ones endlessly; outcome is stored.
  return NextResponse.json({ ok: data === "applied", outcome: data });
}
