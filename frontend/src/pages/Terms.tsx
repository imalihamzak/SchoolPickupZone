import { Link } from "react-router-dom";

const TERMS_CSS = `
.pz-terms-page {
  min-height: 100vh;
  background: #F4F6FA;
  color: #0A1628;
  font-family: Inter, "Segoe UI", Arial, sans-serif;
  padding: 40px 18px;
}

.pz-terms-shell {
  max-width: 920px;
  margin: 0 auto;
  background: #FFFFFF;
  border: 1px solid #E2E6EE;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(7, 29, 59, 0.08);
  overflow: hidden;
}

.pz-terms-header {
  padding: 28px 32px;
  background: #071D3B;
  color: #FFFFFF;
}

.pz-terms-kicker {
  color: #2DC98F;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.pz-terms-title {
  margin: 0;
  font-size: clamp(28px, 4vw, 42px);
  line-height: 1.08;
  font-weight: 800;
}

.pz-terms-body {
  padding: 30px 32px;
}

.pz-terms-body h2 {
  font-size: 17px;
  margin: 24px 0 8px;
}

.pz-terms-body h2:first-child {
  margin-top: 0;
}

.pz-terms-body p,
.pz-terms-body li {
  color: #4A5568;
  font-size: 14px;
  line-height: 1.72;
}

.pz-terms-body ul {
  padding-left: 20px;
  margin: 8px 0 0;
}

.pz-terms-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 18px 32px;
  border-top: 1px solid #E2E6EE;
  background: #FAFBFD;
}

.pz-terms-link {
  color: #1A9E75;
  font-weight: 800;
  text-decoration: none;
}

.pz-terms-link:hover {
  text-decoration: underline;
}
`;

export default function TermsPage() {
  return (
    <main className="pz-terms-page">
      <style>{TERMS_CSS}</style>
      <article className="pz-terms-shell">
        <header className="pz-terms-header">
          <div className="pz-terms-kicker">Pickup Zone</div>
          <h1 className="pz-terms-title">Terms & Conditions</h1>
        </header>
        <div className="pz-terms-body">
          <h2>Service Use</h2>
          <p>
            Pickup Zone provides school dismissal, guardian verification, QR-code pickup, and billing tools for
            authorized schools. Users must provide accurate account, school, guardian, and billing information.
          </p>

          <h2>School Authorization</h2>
          <p>
            By registering a school, the School Admin confirms that they are authorized to create and manage the
            school account, invite users, manage student records, and approve subscription billing for that school.
          </p>

          <h2>Billing Authorization</h2>
          <p>
            By selecting a package and continuing to Stripe Checkout, the School Admin authorizes recurring billing
            for the selected monthly or yearly subscription package. Stripe securely collects and stores payment
            method details.
          </p>
          <ul>
            <li>Subscriptions renew automatically unless cancelled.</li>
            <li>Plan upgrades may apply immediately with prorated billing.</li>
            <li>Plan downgrades may be scheduled for the next billing cycle.</li>
            <li>Failed payments may trigger retries, reminders, grace periods, and account suspension.</li>
          </ul>

          <h2>Data Responsibility</h2>
          <p>
            Schools are responsible for keeping student, parent, guardian, custody, and access information accurate.
            Pickup Zone stores operational records for security, audit, billing, and support purposes.
          </p>

          <h2>Suspension & Cancellation</h2>
          <p>
            Access may be limited if a subscription expires, payment fails beyond the configured grace period, or a
            school is suspended by the platform administrator. Cancelled subscriptions remain active until the end of
            the paid billing period when cancellation is scheduled for period end.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about billing, account access, or these terms should be sent through the school or platform
            support contact listed in Pickup Zone.
          </p>
        </div>
        <footer className="pz-terms-footer">
          <span>Terms version: 2026-05-01</span>
          <Link className="pz-terms-link" to="/signup">
            Return to signup
          </Link>
        </footer>
      </article>
    </main>
  );
}
