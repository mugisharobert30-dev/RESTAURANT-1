// supabase/functions/payment-webhook/index.ts
// Deno Edge Function — receives payment provider callbacks (MTN MoMo /
// Airtel Money / card PSP) and marks matching orders as paid.
//
// Deploy:  supabase functions deploy payment-webhook --no-verify-jwt
// Secret:  supabase secrets set PAYMENT_WEBHOOK_SECRET=...

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const WEBHOOK_SECRET = Deno.env.get("PAYMENT_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Shared-secret auth header from the provider or gateway proxy.
  const provided = req.headers.get("x-webhook-secret") ?? "";
  if (!WEBHOOK_SECRET || provided !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Expected payload (normalise per provider in a switch if needed):
    // { order_number, status: "SUCCESSFUL" | "FAILED", provider_ref, amount }
    const payload = await req.json();
    const { order_number, status, provider_ref, amount } = payload;

    if (!order_number) {
      return json({ error: "order_number is required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")! // bypasses RLS by design
    );

    const { data: order, error } = await admin
      .from("orders")
      .select("id, total, payment_status")
      .eq("order_number", order_number)
      .single();

    if (error || !order) {
      return json({ error: "Order not found" }, 404);
    }
    if (order.payment_status === "paid") {
      return json({ ok: true, alreadyPaid: true });
    }

    const paid = status === "SUCCESSFUL";
    const { error: updateError } = await admin
      .from("orders")
      .update({
        payment_status: paid ? "paid" : "failed",
        payment_method: "mtn_momo",
        momo_pay_ref: provider_ref ?? null,
        paid_at: paid ? new Date().toISOString() : null,
      })
      .eq("id", order.id);

    if (updateError) throw updateError;

    await admin.from("notifications").insert({
      target: "admin",
      title: paid ? "Payment received" : "Payment failed",
      body: `${order_number} · ${amount ?? ""} via mobile money${provider_ref ? ` (ref ${provider_ref})` : ""}`,
      kind: "payment",
      link: `/admin/payments`,
    });

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ error: "Invalid payload" }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
