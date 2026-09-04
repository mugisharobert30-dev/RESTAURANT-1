"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Banknote, Bike, Check, ChevronLeft, CreditCard, MapPin, ShoppingBag,
  Smartphone, Store, Tag, UtensilsCrossed, Wallet, Loader2, Ban,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/context/auth-context";
import { useStoreData } from "@/hooks/use-store";
import { useToast } from "@/context/toast-context";
import { validateCoupon, placeOrder } from "@/lib/db";
import { fmtRWF, cx } from "@/lib/format";
import type { OrderType, PaymentMethod } from "@/lib/types";
import { Button, ConfirmDialog, EmptyState, Input, Select, Textarea } from "@/components/ui";

const ORDER_TYPES: Array<{ value: OrderType; label: string; desc: string; icon: typeof Bike }> = [
  { value: "delivery", label: "Delivery", desc: "To your door in 30–45 min", icon: Bike },
  { value: "takeaway", label: "Takeaway", desc: "Ready for pickup in ~20 min", icon: Store },
  { value: "dine_in", label: "Dine-in", desc: "We bring it to your table", icon: UtensilsCrossed },
];

const PAYMENTS: Array<{ value: PaymentMethod; label: string; desc: string; icon: typeof CreditCard }> = [
  { value: "mtn_momo", label: "MTN Mobile Money", desc: "Approve on your phone (*182#)", icon: Smartphone },
  { value: "airtel_money", label: "Airtel Money", desc: "Dial *500# to approve", icon: Wallet },
  { value: "card", label: "Card", desc: "Visa / Mastercard — secure checkout", icon: CreditCard },
  { value: "cash_on_delivery", label: "Cash on delivery", desc: "Pay the rider when it arrives", icon: Banknote },
];

export default function CheckoutPage() {
  const cart = useCart();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const settings = useStoreData((d) => d.settings);
  const addresses = useStoreData((d) => d.addresses);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderType, setOrderType] = useState<OrderType>(cart.tableLabel ? "dine_in" : "delivery");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressId, setAddressId] = useState<string>("new");
  const [manualAddress, setManualAddress] = useState("");
  const [instructions, setInstructions] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("mtn_momo");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmCancel, setConfirmCancel] = useState(false);

  const profile = auth.profile;
  const savedAddress = addressId !== "new" ? addresses.find((a) => a.id === addressId) : undefined;
  const deliveryFee = orderType === "delivery" ? settings.delivery_fee : 0;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, cart.subtotal + deliveryFee - discount);

  const availablePayments = useMemo(
    () => PAYMENTS.filter((p) => (orderType === "delivery" ? true : p.value !== "cash_on_delivery")),
    [orderType]
  );

  if (cart.lines.length === 0 && !processing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<ShoppingBag className="h-5 w-5" />}
          title="Your cart is empty"
          message="Add a few dishes before heading to checkout — the chicken luwombo is calling."
          action={<Link href="/menu" className="inline-flex h-11 items-center rounded-xl bg-brand-600 px-6 font-bold text-white">Explore Menu</Link>}
        />
      </div>
    );
  }

  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    const finalName = name || profile?.full_name;
    const finalPhone = phone || profile?.phone;
    if (!finalName?.trim()) e.name = "We need a name for the order.";
    if (!finalPhone?.trim()) e.phone = "A phone number helps us reach you.";
    else if (!/^(\+?\d[\d\s-]{7,})$/.test(finalPhone.trim())) e.phone = "Enter a valid phone number, e.g., +250 788 123 456.";
    if (orderType === "delivery") {
      const usingSaved = !!savedAddress;
      if (!usingSaved && manualAddress.trim().length < 8) {
        e.address = "Please give us a street or landmark so the rider finds you.";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    const res = await validateCoupon(couponInput, cart.subtotal);
    setCouponMsg({ ok: res.ok, text: res.message });
    if (res.ok) {
      setCoupon({ code: couponInput.trim().toUpperCase(), discount: res.discount });
      toast(res.message);
    }
  };

  const submitOrder = async () => {
    setProcessing(true);
    try {
      const order = await placeOrder({
        lines: cart.lines.map((l) => ({ menu_item_id: l.menu_item_id, name: l.name, quantity: l.quantity, unit_price: l.unit_price, options: l.options, special_instructions: l.special_instructions })),
        customer: profile,
        customer_name: name || profile?.full_name || "Guest",
        customer_phone: phone || profile?.phone || "-",
        customer_email: email || profile?.email,
        type: orderType,
        table_label: orderType === "dine_in" ? cart.tableLabel ?? undefined : undefined,
        delivery_address: orderType === "delivery" ? (savedAddress ? `${savedAddress.address_line}, ${savedAddress.district}` : manualAddress) : undefined,
        payment_method: payment,
        coupon_code: coupon?.code,
        discount,
        special_instructions: instructions || undefined,
      });
      cart.clear();
      router.push(`/order/${order.id}?placed=1`);
    } catch {
      toast("Something went wrong placing your order. Please try again.", "error");
      setProcessing(false);
    }
  };

  const cancelOrder = () => {
    cart.clear();
    setConfirmCancel(false);
    toast("Your order was cancelled. Your cart is now empty.");
    router.push("/menu");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <button onClick={() => (step > 1 ? setStep((s) => (s - 1) as 1 | 2) : router.back())} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-cocoa/60 hover:text-cocoa">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <h1 className="font-display text-3xl font-extrabold">Checkout</h1>

      <ol className="mt-5 flex items-center gap-2 text-sm font-semibold" aria-label="Checkout progress">
        {[
          [1, "Order type"],
          [2, "Your details"],
          [3, "Payment"],
        ].map(([n, label]) => (
          <li key={String(n)} className="flex items-center gap-2">
            <span className={cx("flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold", step >= (n as number) ? "bg-brand-600 text-white" : "bg-stone-200 text-cocoa/50")}>
              {step > (n as number) ? <Check className="h-3.5 w-3.5" /> : n}
            </span>
            <span className={cx(step >= (n as number) ? "text-cocoa" : "text-cocoa/40", "hidden sm:inline")}>{label}</span>
            {Number(n) < 3 && <span aria-hidden="true" className="mx-1 h-px w-6 bg-cocoa/15 sm:w-10" />}
          </li>
        ))}
      </ol>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          {step === 1 && (
            <div className="animate-fadeUp space-y-4">
              <h2 className="font-display text-xl font-bold">How would you like to enjoy your meal?</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {ORDER_TYPES.map((ot) => (
                  <button
                    key={ot.value}
                    onClick={() => setOrderType(ot.value)}
                    aria-pressed={orderType === ot.value}
                    className={cx(
                      "rounded-2xl border-2 p-4 text-left transition-all",
                      orderType === ot.value ? "border-brand-600 bg-brand-50 shadow-sm" : "border-cocoa/10 bg-white hover:border-brand-300"
                    )}
                  >
                    <ot.icon className={cx("h-6 w-6", orderType === ot.value ? "text-brand-700" : "text-cocoa/50")} />
                    <p className="mt-2 font-bold">{ot.label}</p>
                    <p className="mt-0.5 text-xs text-cocoa/55">{ot.desc}</p>
                  </button>
                ))}
              </div>
              {cart.tableLabel && (
                <div className={`rounded-xl p-4 ${orderType === "dine_in" ? "bg-leaf-50 text-leaf-800 ring-1 ring-leaf-200" : "bg-sky-50 text-sky-800 ring-1 ring-sky-200"}`}>
                  {orderType === "dine_in" ? (
                    <p className="flex items-center gap-2 text-sm"><UtensilsCrossed className="h-4 w-4" /> You scanned <strong>Table {cart.tableLabel}</strong>. Your food will come straight to you.</p>
                  ) : (
                    <p className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4" /> Heads up: you are at Table {cart.tableLabel}. Choose dine-in and we will serve you right here.</p>
                  )}
                </div>
              )}
              <Button size="lg" className="w-full sm:w-auto" onClick={() => setStep(2)}>Continue</Button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fadeUp space-y-4">
              <h2 className="font-display text-xl font-bold">Tell us who this is for</h2>
              {!profile && (
                <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800 ring-1 ring-sky-100">
                  Ordering as guest. <Link href="/login?next=/checkout" className="font-bold underline">Log in</Link> to save time next order.
                </p>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name *" name="name" autoComplete="name" placeholder="Chantal Uwase" error={errors.name} value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Phone number *" name="phone" autoComplete="tel" placeholder="+250 788 123 456" error={errors.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Input label="Email (optional)" name="email" type="email" autoComplete="email" placeholder="you@example.rw" hint="For your receipt and order updates." value={email} onChange={(e) => setEmail(e.target.value)} />

              {orderType === "delivery" && (
                <div className="space-y-3 rounded-2xl border border-cocoa/10 bg-white p-4">
                  {profile && addresses.filter((a) => a.customer_id === profile.id).length > 0 && (
                    <Select label="Delivery address" name="addressChoice" value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                      {addresses.filter((a) => a.customer_id === profile.id).map((a) => (
                        <option key={a.id} value={a.id}>{a.label} — {a.address_line}</option>
                      ))}
                      <option value="new">Use a new address…</option>
                    </Select>
                  )}
                  {(addressId === "new" || !profile) && (
                    <>
                      <Input label="Street / house / landmark *" name="addressLine" placeholder="KG 11 Ave, House 24, near Kimihurura Roundabout" error={errors.address} value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} />
                      <p className="text-xs text-cocoa/50">We deliver to: {settings.delivery_zones.join(", ")}.</p>
                    </>
                  )}
                </div>
              )}

              <Textarea label="Special instructions (optional)" name="notes" placeholder="Ring the gate bell twice, no onions, extra chili…" value={instructions} onChange={(e) => setInstructions(e.target.value)} />

              <Button size="lg" onClick={() => validateStep2() && setStep(3)} className="w-full sm:w-auto">Continue to payment</Button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fadeUp space-y-5">
              <h2 className="font-display text-xl font-bold">Choose how to pay</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[...availablePayments, ...(orderType !== "delivery" ? [{ value: "pay_at_counter" as PaymentMethod, label: "Pay at counter / waiter", desc: "Settle when you collect or dine", icon: Banknote }] : [])].map((pm) => (
                  <button
                    key={pm.value}
                    onClick={() => setPayment(pm.value)}
                    aria-pressed={payment === pm.value}
                    className={cx(
                      "flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                      payment === pm.value ? "border-brand-600 bg-brand-50" : "border-cocoa/10 bg-white hover:border-brand-300"
                    )}
                  >
                    <span className={cx("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", payment === pm.value ? "bg-brand-600 text-white" : "bg-stone-100 text-cocoa/60")}>
                      <pm.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold">{pm.label}</span>
                      <span className="mt-0.5 block text-xs text-cocoa/55">{pm.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
              {payment === "card" && (
                <p className="rounded-xl bg-stone-100 px-4 py-3 text-xs leading-relaxed text-cocoa/60">
                  Card fields open in our secure payment window at confirmation. We never see or store your card numbers — PCI-compliant processing only.
                </p>
              )}
              <Button size="lg" className="w-full" loading={processing} disabled={processing} onClick={() => void submitOrder()}>
                {processing ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Waiting for payment approval…</>) : `Place order · ${fmtRWF(total)}`}
              </Button>
              <p className="text-center text-xs text-cocoa/50">You can still cancel free of charge while your order is being prepared.</p>
            </div>
          )}
        </section>

        <aside aria-label="Order summary" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-cocoa/10 bg-white p-5 shadow-card">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
            <ul className="mt-3 max-h-64 divide-y divide-cocoa/6 overflow-y-auto text-sm">
              {cart.lines.map((l) => (
                <li key={l.key} className="flex justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{l.quantity} × {l.name}</span>
                    {l.options.length > 0 && <span className="block truncate text-xs text-cocoa/45">{l.options.join(", ")}</span>}
                  </span>
                  <span className="shrink-0 font-semibold">{fmtRWF(l.unit_price * l.quantity)}</span>
                </li>
              ))}
            </ul>

            {!coupon && (
              <div className="mt-4 flex gap-2">
                <div className="relative flex-1">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa/35" />
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Promo code (try WELCOME10)"
                    aria-label="Promo code"
                    className="h-10 w-full rounded-xl border border-dashed border-cocoa/25 pl-9 pr-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                </div>
                <Button variant="outline" onClick={() => void applyCoupon()}>Apply</Button>
              </div>
            )}
            {couponMsg && <p className={cx("mt-2 text-xs font-semibold", couponMsg.ok ? "text-leaf-700" : "text-red-600")} role="status">{couponMsg.text}</p>}

            <dl className="mt-4 space-y-1.5 border-t border-cocoa/8 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-cocoa/60">Subtotal</dt><dd>{fmtRWF(cart.subtotal)}</dd></div>
              {deliveryFee > 0 && <div className="flex justify-between"><dt className="text-cocoa/60">Delivery fee</dt><dd>{fmtRWF(deliveryFee)}</dd></div>}
              {discount > 0 && (
                <div className="flex justify-between font-semibold text-leaf-700">
                  <dt>Discount ({coupon?.code})</dt><dd>−{fmtRWF(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-cocoa/8 pt-2 text-base font-extrabold">
                <dt>Total</dt><dd>{fmtRWF(total)}</dd>
              </div>
              <p className="pt-1 text-xs text-cocoa/40">VAT included where applicable.</p>
            </dl>
            <Button variant="ghost" size="sm" className="mt-4 w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setConfirmCancel(true)}>
              <Ban className="h-4 w-4" /> Cancel all
            </Button>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this order?"
        message={`Remove all ${cart.count} item${cart.count === 1 ? "" : "s"} from your cart and go back to the menu? This cannot be undone.`}
        confirmLabel="Yes, cancel order"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={cancelOrder}
      />
    </div>
  );
}
