import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import "./payment-status.css";

type ConfirmationState = "confirming" | "confirmed" | "delayed";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<ConfirmationState>(sessionId ? "confirming" : "delayed");

  useEffect(() => {
    let redirectTimer: number | undefined;
    let isMounted = true;

    const redirectToDashboard = () => {
      redirectTimer = window.setTimeout(() => {
        window.location.replace("/admin?billing=refreshed");
      }, 1800);
    };

    const confirmSession = async () => {
      if (!sessionId) {
        redirectToDashboard();
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/superadmin/subscription/subscribe/confirm-session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok) {
          throw new Error("Checkout confirmation failed");
        }

        if (isMounted) {
          setState("confirmed");
          redirectToDashboard();
        }
      } catch (error) {
        console.error("Payment confirmation failed:", error);
        if (isMounted) {
          setState("delayed");
          redirectToDashboard();
        }
      }
    };

    confirmSession();

    return () => {
      isMounted = false;
      if (redirectTimer) window.clearTimeout(redirectTimer);
    };
  }, [sessionId]);

  const isConfirming = state === "confirming";

  return (
    <main className="pz-payment-page">
      <section className="pz-payment-card">
        <div className="pz-payment-kicker">PickupZone Billing</div>
        <div className="pz-payment-icon success">
          {isConfirming ? (
            <LoadingSpinner size="lg" label="Confirming payment" />
          ) : (
            <CheckCircle2 aria-hidden="true" />
          )}
        </div>
        <h1>{isConfirming ? "Confirming Payment" : "Payment Successful"}</h1>
        <p>
          {isConfirming
            ? "Your payment was received. We are activating your school subscription now."
            : state === "confirmed"
              ? "Your school subscription is active. Redirecting to your dashboard."
              : "Your payment was received. Stripe may take a moment to finish syncing locally."}
        </p>
        <div className="pz-payment-progress">
          <span />
        </div>
        <Link className="pz-payment-link" to="/admin">
          Open Dashboard
        </Link>
      </section>
    </main>
  );
}
