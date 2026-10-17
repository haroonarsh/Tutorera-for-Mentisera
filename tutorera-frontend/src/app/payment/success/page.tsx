"use client";

import api from "@/lib/axios";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/site";
import Link from "next/link";
import { useEffect, useState } from "react";
import s from "../../compliance-pages.module.css";

type VerifiedPayment = {
  verified: boolean;
  paymentStatus: string;
  bookingStatus: string;
  bookingId?: string;
  amount?: number;
  currency?: string;
};

// A return redirect can be forged or reached before the payment webhook.
// Only a server-verified booking is presented as successfully paid.
export default function PaymentSuccessPage() {
  const [payment, setPayment] = useState<VerifiedPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const booking = query.get("booking");
    const bid = query.get("bid");
    const kind = booking ? "booking" : "bid";
    const id = booking || bid;
    if (!id) {
      setError("This return link does not include a booking reference. Check your dashboard for the verified status.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    api.get<VerifiedPayment>(`/payments/status/${kind}/${encodeURIComponent(id)}`, { headers: { "Cache-Control": "no-cache" } })
      .then((response) => { if (!cancelled) setPayment(response.data); })
      .catch(() => { if (!cancelled) setError("Payment status could not be verified. Sign in to the paying account and check your dashboard."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const confirmed = payment?.verified === true;
  const title = confirmed ? "Payment confirmed" : "Payment verification";
  return (
    <div className={s.page}>
      <section className={s.hero}><h1>{title}</h1><p>{confirmed ? "Your booking payment was verified by TUTORERA." : "Returning from the gateway does not confirm that payment has settled."}</p></section>
      <section className={s.narrow}><div className={s.infoBox} role="status" aria-live="polite">
        {loading ? <p>Checking your booking against the secure payment records…</p> : error ? <p>{error}</p> : payment ? (
          <>
            <p><strong>Payment status:</strong> {confirmed ? "Confirmed" : payment.paymentStatus}</p>
            <p><strong>Booking status:</strong> {payment.bookingStatus}</p>
            {payment.bookingId && <p><strong>Booking reference:</strong> {payment.bookingId}</p>}
            {confirmed && typeof payment.amount === "number" && <p><strong>Amount:</strong> {payment.currency || "PKR"} {payment.amount.toLocaleString()}</p>}
            {!confirmed && <p>Please do not make a second payment until you have checked your dashboard or contacted support. This screen will not treat a redirect as evidence of payment.</p>}
          </>
        ) : <p>Payment confirmation is not currently available.</p>}
        <p><strong>Support:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> · {SUPPORT_PHONE}</p>
        <Link className={s.cta} href="/dashboard">View verified booking status</Link>
      </div></section>
    </div>
  );
}
