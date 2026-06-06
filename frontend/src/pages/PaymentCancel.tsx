import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import "./payment-status.css";

export default function PaymentCancel() {
  return (
    <main className="pz-payment-page">
      <section className="pz-payment-card">
        <div className="pz-payment-kicker">PickupZone Billing</div>
        <div className="pz-payment-icon warning">
          <AlertCircle aria-hidden="true" />
        </div>
        <h1>Payment Cancelled</h1>
        <p>
          The checkout was closed before payment was completed. Your school package is unchanged.
        </p>
        <Link className="pz-payment-link" to="/admin">
          Return to Dashboard
        </Link>
      </section>
    </main>
  );
}
