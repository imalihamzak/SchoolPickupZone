import { CalendarDays, CreditCard, RotateCcw, XCircle } from "lucide-react";
import { Subscription } from "../types/subscription.types";
import "../../super-admin-theme.css";

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onCancelSubscription: (id: number) => void;
  onReactivateSubscription: (id: number) => void;
}

export function SubscriptionList({
  subscriptions,
  onCancelSubscription,
  onReactivateSubscription,
}: SubscriptionListProps) {
  if (!subscriptions.length) {
    return <div className="pz-super-empty">No active subscription records available.</div>;
  }

  return (
    <div className="pz-super-table-wrap">
      <table className="pz-super-table">
        <thead>
          <tr>
            <th>School</th>
            <th>Admin</th>
            <th>Period</th>
            <th>Billing</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <td>
                <div className="pz-super-entity-cell">
                  <div className="pz-super-avatar">{subscription.schoolName.charAt(0)}</div>
                  <div>
                    <div className="pz-super-entity-name">{subscription.schoolName}</div>
                    <div className="pz-super-entity-sub">
                      {subscription.planName || `Package ID ${subscription.planId || "N/A"}`}
                    </div>
                    {subscription.pendingPlanName && (
                      <div className="pz-super-entity-sub">
                        {subscription.pendingChangeType === "downgrade" ? "Downgrades" : "Changes"} to{" "}
                        {subscription.pendingPlanName} on {subscription.pendingChangeEffectiveAt || "next cycle"}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td>{subscription.adminName}</td>
              <td>
                <div className="pz-super-entity-cell">
                  <CalendarDays size={15} aria-hidden="true" />
                  <div>
                    <div>{subscription.startDate || "N/A"}</div>
                    <div className="pz-super-entity-sub">Ends {subscription.endDate || "N/A"}</div>
                  </div>
                </div>
              </td>
              <td>
                <div className="pz-super-entity-cell">
                  <CreditCard size={15} aria-hidden="true" />
                  <div>
                    <div>${subscription.lastPayment}</div>
                    <div className="pz-super-entity-sub">
                      {subscription.billingInterval || "monthly"} | Next {subscription.nextBilling || "N/A"}
                    </div>
                    <div className="pz-super-entity-sub">
                      Grace {subscription.gracePeriodDays ?? 7} days
                    </div>
                    {subscription.failedPaymentCount ? (
                      <div className="pz-super-entity-sub">
                        Failed payments: {subscription.failedPaymentCount}
                        {subscription.gracePeriodEndsAt ? ` | Grace ends ${subscription.gracePeriodEndsAt}` : ""}
                      </div>
                    ) : null}
                    {subscription.cancelAtPeriodEnd && (
                      <div className="pz-super-entity-sub">
                        Cancels at period end
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <span className={`pz-super-badge ${statusClass(subscription.status)}`}>
                  <span className="pz-super-badge-dot" />
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </span>
              </td>
              <td>
                <div className="pz-super-table-actions">
                  {subscription.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => onCancelSubscription(subscription.id)}
                      className="pz-super-button danger"
                    >
                      <XCircle size={15} aria-hidden="true" />
                      Cancel
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onReactivateSubscription(subscription.id)}
                      className="pz-super-button"
                    >
                      <RotateCcw size={15} aria-hidden="true" />
                      Reactivate
                    </button>
                  )}
                  {subscription.schoolStatus === "Suspended" && (
                    <span className="pz-super-badge red">
                      <span className="pz-super-badge-dot" />
                      School Suspended
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusClass(status: Subscription["status"]) {
  if (status === "active") return "green";
  if (status === "cancelled") return "gray";
  if (status === "expiring soon") return "amber";
  return "red";
}
