import { CheckCircle2, Clock3, CreditCard, ExternalLink, Landmark, XCircle } from "lucide-react";
import { Payment } from "../types/subscription.types";
import "../../super-admin-theme.css";

interface PaymentHistoryProps {
  payments: Payment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  if (!payments.length) {
    return <div className="pz-super-empty">No payment records match the current filters.</div>;
  }

  return (
    <div className="pz-super-table-wrap">
      <table className="pz-super-table">
        <thead>
          <tr>
            <th>School</th>
            <th>Invoice</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Method</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>
                <div className="pz-super-entity-cell">
                  <div className="pz-super-avatar">{payment.schoolName?.charAt(0) || "P"}</div>
                  <div>
                    <div className="pz-super-entity-name">{payment.schoolName}</div>
                    <div className="pz-super-entity-sub">Plan: {payment.planName}</div>
                    <div className="pz-super-entity-sub">Txn: {payment.transactionId}</div>
                    {payment.billingReason && (
                      <div className="pz-super-entity-sub">Reason: {formatBillingReason(payment.billingReason)}</div>
                    )}
                    {payment.failureReason && (
                      <div className="pz-super-entity-sub">Failure: {payment.failureReason}</div>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <div className="pz-super-entity-name">
                  {payment.invoiceNumber || payment.stripeInvoiceId || "N/A"}
                </div>
                {payment.attemptCount ? (
                  <div className="pz-super-entity-sub">Attempt: {payment.attemptCount}</div>
                ) : null}
                {payment.invoiceDueDate ? (
                  <div className="pz-super-entity-sub">Due: {payment.invoiceDueDate}</div>
                ) : null}
                {(payment.invoiceHostedUrl || payment.invoicePdfUrl) && (
                  <a
                    href={payment.invoiceHostedUrl || payment.invoicePdfUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="pz-super-inline-link"
                  >
                    <ExternalLink size={13} aria-hidden="true" />
                    Open
                  </a>
                )}
              </td>
              <td>{payment.date || "N/A"}</td>
              <td>
                <strong style={{ color: "var(--text-1)" }}>${payment.amount}</strong>
              </td>
              <td>
                <span className={`pz-super-badge ${statusClass(payment.status)}`}>
                  {statusIcon(payment.status)}
                  {statusLabel(payment.status)}
                </span>
              </td>
              <td>
                <div className="pz-super-entity-cell">
                  {payment.method === "Credit Card" ? (
                    <CreditCard size={15} aria-hidden="true" />
                  ) : (
                    <Landmark size={15} aria-hidden="true" />
                  )}
                  <span>{payment.method || "N/A"}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pz-super-card-header" style={{ borderTop: "1px solid var(--border)", borderBottom: 0 }}>
        <div className="pz-super-subtitle" style={{ marginTop: 0 }}>
          Showing {payments.length} payment record{payments.length === 1 ? "" : "s"}.
        </div>
      </div>
    </div>
  );
}

function statusClass(status: Payment["status"]) {
  const normalized = String(status).toLowerCase();
  if (normalized === "successful") return "green";
  if (normalized === "pending") return "amber";
  return "red";
}

function statusLabel(status: Payment["status"]) {
  const normalized = String(status).toLowerCase();
  if (normalized === "successful") return "Successful";
  if (normalized === "pending") return "Pending";
  return "Failed";
}

function statusIcon(status: Payment["status"]) {
  const normalized = String(status).toLowerCase();
  if (normalized === "successful") return <CheckCircle2 size={13} aria-hidden="true" />;
  if (normalized === "pending") return <Clock3 size={13} aria-hidden="true" />;
  return <XCircle size={13} aria-hidden="true" />;
}

function formatBillingReason(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
