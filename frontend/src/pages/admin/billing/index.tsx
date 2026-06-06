import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import axios from "axios";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileText,
  Info,
  RefreshCcw,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { API_BASE_URL } from "@/lib/api/link";
import { toast } from "@/components/ui/toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminPageSkeleton from "@/components/ui/AdminPageSkeleton";
import "../../super-admin/super-admin-theme.css";

type BillingInterval = "monthly" | "yearly";

type BillingPlan = {
  id: number;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents: number | null;
  maxFamilies: number | null;
  maxGuards: number | null;
  storageLimitMb: number | null;
  gracePeriodDays: number;
  isActive: boolean;
};

type BillingSubscription = {
  id: number;
  planId: number;
  planName: string;
  billingInterval: BillingInterval;
  status: string;
  startDate: string | null;
  endDate: string | null;
  nextBillingDate: string | null;
  lastPaymentAmount: number;
  failedPaymentCount: number;
  lastPaymentFailedAt: string | null;
  gracePeriodEndsAt: string | null;
  gracePeriodDays: number;
  cancelAtPeriodEnd: boolean;
  pendingPlanId: number | null;
  pendingPlanName: string | null;
  pendingBillingInterval: BillingInterval | null;
  pendingChangeType: string | null;
  pendingChangeEffectiveAt: string | null;
  hasStripeCustomer: boolean;
  hasStripeSubscription: boolean;
};

type BillingPayment = {
  id: number;
  amount: number;
  status: string;
  method: string;
  paymentDate: string | null;
  stripeInvoiceId: string | null;
  invoiceNumber: string | null;
  invoiceDueDate: string | null;
  invoiceHostedUrl: string | null;
  invoicePdfUrl: string | null;
  billingReason: string | null;
  failureReason: string | null;
};

type BillingPackageChange = {
  changeType: string;
  fromPlanName: string | null;
  toPlanName: string | null;
  fromBillingInterval: BillingInterval | null;
  toBillingInterval: BillingInterval | null;
  effectiveAt: string | null;
  createdAt: string | null;
  notes: string | null;
  createdByRole: string | null;
  createdByName: string | null;
};

type BillingSummary = {
  subscription: BillingSubscription | null;
  usage: {
    students: number;
    families: number;
    guards: number;
  };
  plans: BillingPlan[];
  payments: BillingPayment[];
  latestPackageChange: BillingPackageChange | null;
};

const ADMIN_BILLING_CSS = `
.pz-billing-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.48fr);
  gap: 16px;
  margin-bottom: 18px;
}

.pz-billing-plan-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.pz-billing-plan {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
  background: var(--white);
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 248px;
}

.pz-billing-plan.active {
  border-color: rgba(26,158,117,0.42);
  box-shadow: 0 0 0 3px rgba(26,158,117,0.1);
}

.pz-billing-plan-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.pz-billing-plan-name {
  font-family: 'Inter', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-1);
}

.pz-billing-price {
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  font-size: 30px;
  font-weight: 800;
  color: var(--text-1);
  line-height: 1;
}

.pz-billing-price span {
  color: var(--text-3);
  font-size: 12px;
  font-weight: 700;
}

.pz-billing-meta {
  display: flex;
  flex-direction: column;
  gap: 7px;
  color: var(--text-2);
  font-size: 12px;
  line-height: 1.45;
}

.pz-billing-button-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
}

.pz-billing-interval {
  display: inline-flex;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
  gap: 4px;
}

.pz-billing-interval button {
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  background: transparent;
  color: var(--text-2);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.pz-billing-interval button.active {
  background: var(--white);
  color: var(--teal);
  box-shadow: var(--shadow-sm);
}

.pz-billing-detail-list {
  display: flex;
  flex-direction: column;
}

.pz-billing-detail {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

.pz-billing-detail:last-child {
  border-bottom: none;
}

.pz-billing-detail span:first-child {
  color: var(--text-3);
  font-weight: 700;
}

.pz-billing-detail span:last-child {
  color: var(--text-1);
  font-weight: 800;
  text-align: right;
}

.pz-billing-notice {
  border: 1px solid rgba(27,110,204,0.18);
  background: linear-gradient(135deg, #F7FBFF 0%, #FFFFFF 100%);
  border-radius: var(--radius);
  padding: 16px 18px;
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  box-shadow: var(--shadow-sm);
}

.pz-billing-notice-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.pz-billing-notice-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #EFF6FF;
  color: #1B6ECC;
  flex: 0 0 auto;
}

.pz-billing-notice-title {
  font-size: 14px;
  font-weight: 800;
  color: var(--text-1);
  margin-bottom: 4px;
}

.pz-billing-notice-copy {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-2);
}

.pz-billing-confirm-list {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 16px;
}

.pz-billing-confirm-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

.pz-billing-confirm-row:last-child {
  border-bottom: 0;
}

.pz-billing-confirm-row span:first-child {
  color: var(--text-3);
  font-weight: 700;
}

.pz-billing-confirm-row span:last-child {
  color: var(--text-1);
  font-weight: 800;
  text-align: right;
}

@media (max-width: 1180px) {
  .pz-billing-grid,
  .pz-billing-plan-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .pz-billing-notice {
    flex-direction: column;
    align-items: stretch;
  }

  .pz-billing-confirm-row {
    flex-direction: column;
    gap: 4px;
  }

  .pz-billing-confirm-row span:last-child {
    text-align: left;
  }
}
`;

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

type PackageChangeIntent = {
  plan: BillingPlan;
  changeType: "upgrade" | "downgrade" | "change";
  currentAmount: number;
  nextAmount: number;
};

export default function AdminBilling() {
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [packageChangeIntent, setPackageChangeIntent] = useState<PackageChangeIntent | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const subscription = summary?.subscription || null;

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    if (subscription?.billingInterval) {
      setBillingInterval(subscription.billingInterval);
    }
  }, [subscription?.billingInterval]);

  const currentStatusClass = statusClass(subscription?.status);
  const currentPlan = useMemo(
    () => summary?.plans.find((plan) => Number(plan.id) === Number(subscription?.planId)) || null,
    [summary?.plans, subscription?.planId]
  );
  const hasActivePaidSubscription = isActivePaidSubscription(subscription);
  const billingNotice = useMemo(
    () => buildBillingNotice(subscription, summary?.latestPackageChange || null),
    [subscription, summary?.latestPackageChange]
  );

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/admin/billing/summary`, {
        headers: authHeaders(),
      });
      setSummary(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to load billing.");
    } finally {
      setLoading(false);
    }
  };

  const openStripePortal = async () => {
    try {
      setWorking("portal");
      const response = await axios.post(
        `${API_BASE_URL}/admin/billing/portal-session`,
        {},
        { headers: authHeaders() }
      );
      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }
      throw new Error("Stripe portal URL was not returned.");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Unable to open Stripe billing portal.");
    } finally {
      setWorking(null);
    }
  };

  const openCheckout = async (planId?: number, interval: BillingInterval = billingInterval) => {
    try {
      setWorking("checkout");
      const response = await axios.post(
        `${API_BASE_URL}/admin/billing/checkout-session`,
        {
          planId: planId || subscription?.planId,
          billingInterval: interval,
        },
        { headers: authHeaders() }
      );
      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }
      throw new Error("Checkout URL was not returned.");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Unable to start Stripe checkout.");
    } finally {
      setWorking(null);
    }
  };

  const executePlanChange = async (plan: BillingPlan) => {
    let completed = false;
    
    try {
      setWorking(`plan-${plan.id}`);
      const response = await axios.post(
        `${API_BASE_URL}/admin/billing/change-plan`,
        {
          planId: plan.id,
          billingInterval,
        },
        { headers: authHeaders() }
      );

      if (response.data?.checkoutRequired) {
        toast.success("Package selected. Redirecting to Stripe checkout...");
        await openCheckout(plan.id, billingInterval);
        return true;
      }

      toast.success(response.data?.message || "Subscription updated.");
      await fetchSummary();
      completed = true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Unable to change package.");
    } finally {
      setWorking(null);
    }

    return completed;
  };

  const requestPlanChange = (plan: BillingPlan) => {
    if (hasActivePaidSubscription && subscription?.hasStripeSubscription) {
      const currentAmount = currentPlan ? getPlanPrice(currentPlan, subscription.billingInterval) : 0;
      const nextAmount = getPlanPrice(plan, billingInterval);
      setPackageChangeIntent({
        plan,
        currentAmount,
        nextAmount,
        changeType: nextAmount > currentAmount ? "upgrade" : nextAmount < currentAmount ? "downgrade" : "change",
      });
      return;
    }

    void executePlanChange(plan);
  };

  const confirmPlanChange = async () => {
    if (!packageChangeIntent) return;
    const completed = await executePlanChange(packageChangeIntent.plan);
    if (completed) {
      setPackageChangeIntent(null);
    }
  };

  const cancelSubscription = async () => {
    try {
      setWorking("cancel");
      const response = await axios.post(
        `${API_BASE_URL}/admin/billing/cancel`,
        {},
        { headers: authHeaders() }
      );
      toast.success(response.data?.message || "Cancellation scheduled.");
      await fetchSummary();
      setCancelModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Unable to cancel subscription.");
    } finally {
      setWorking(null);
    }
  };

  const reactivateSubscription = async () => {
    try {
      setWorking("reactivate");
      const response = await axios.post(
        `${API_BASE_URL}/admin/billing/reactivate`,
        {},
        { headers: authHeaders() }
      );
      toast.success(response.data?.message || "Subscription reactivated.");
      await fetchSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Unable to reactivate subscription.");
    } finally {
      setWorking(null);
    }
  };

  if (loading && !summary) {
    return (
      <DashboardLayout role="admin">
        <AdminPageSkeleton variant="billing" label="Loading billing" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <style>{ADMIN_BILLING_CSS}</style>
      <div className="pz-super-page">
        <div className="pz-super-header">
          <div>
            <div className="pz-super-kicker">School Billing</div>
            <h1 className="pz-super-title">Billing</h1>
            <div className="pz-super-subtitle">
              Manage your package, Stripe payment method, subscription status, and invoices.
            </div>
          </div>
          <div className="pz-super-actions">
            <button type="button" onClick={fetchSummary} className="pz-super-button" disabled={loading}>
              <RefreshCcw size={15} aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={openStripePortal}
              className="pz-super-button primary"
              disabled={working === "portal" || !subscription?.hasStripeCustomer}
            >
              {working === "portal" ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <CreditCard size={15} aria-hidden="true" />}
              Manage In Stripe
            </button>
          </div>
        </div>

        {!loading && billingNotice && (
          <BillingNotice
            notice={billingNotice}
            onCheckout={() => openCheckout(subscription?.planId || currentPlan?.id)}
            checkoutDisabled={working === "checkout" || !subscription?.planId}
          />
        )}

        {loading ? (
          <section className="pz-super-card">
            <div className="pz-super-empty" style={{ gap: 10 }}>
              <LoadingSpinner size="md" label="Loading billing" />
              Loading billing...
            </div>
          </section>
        ) : (
          <>
            <div className="pz-super-kpi-grid compact">
              <SummaryCard
                label="Current Package"
                value={hasActivePaidSubscription ? subscription?.planName || "Not active" : "Not active"}
                helper={
                  hasActivePaidSubscription
                    ? subscription?.billingInterval || "No billing"
                    : subscription?.planName
                      ? `${subscription.planName} needs checkout`
                      : "No billing"
                }
                icon={<ShieldCheck aria-hidden="true" />}
                tone={{ background: "#E1F5EE", color: "#1A9E75" }}
                glow="rgba(26,158,117,0.16)"
              />
              <SummaryCard
                label="Subscription"
                value={subscription?.status || "Inactive"}
                helper={subscription?.cancelAtPeriodEnd ? "Cancels at period end" : "Auto-renewing status"}
                icon={<CheckCircle2 aria-hidden="true" />}
                tone={{ background: "#EFF6FF", color: "#1B6ECC" }}
                glow="rgba(27,110,204,0.16)"
              />
              <SummaryCard
                label="Next Billing"
                value={formatDate(subscription?.nextBillingDate)}
                helper={`Last payment ${formatMoney(subscription?.lastPaymentAmount || 0)}`}
                icon={<CalendarDays aria-hidden="true" />}
                tone={{ background: "#FEF3DC", color: "#EF9F27" }}
                glow="rgba(239,159,39,0.16)"
              />
            </div>

            <div className="pz-billing-grid">
              <section className="pz-super-card">
                <div className="pz-super-card-header">
                  <div>
                    <div className="pz-super-card-title">Subscription Status</div>
                    <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                      Stripe handles card updates, invoices, and saved payment methods.
                    </div>
                  </div>
                  <span className={`pz-super-badge ${currentStatusClass}`}>
                    <span className="pz-super-badge-dot" />
                    {subscription?.status || "Inactive"}
                  </span>
                </div>
                <div style={{ padding: 22 }}>
                  <div className="pz-billing-detail-list">
                    <Detail
                      label="Package"
                      value={
                        hasActivePaidSubscription
                          ? subscription?.planName || "No package"
                          : subscription?.planName
                            ? `${subscription.planName} (checkout required)`
                            : "No package"
                      }
                    />
                    <Detail label="Billing interval" value={subscription?.billingInterval || "N/A"} />
                    <Detail label="Started" value={formatDate(subscription?.startDate)} />
                    <Detail label="Current period ends" value={formatDate(subscription?.endDate)} />
                    <Detail label="Grace period" value={`${subscription?.gracePeriodDays ?? currentPlan?.gracePeriodDays ?? 7} days`} />
                    <Detail label="Failed payments" value={String(subscription?.failedPaymentCount || 0)} />
                    {subscription?.pendingPlanName && (
                      <Detail
                        label="Pending change"
                        value={`${subscription.pendingPlanName} on ${formatDate(subscription.pendingChangeEffectiveAt)}`}
                      />
                    )}
                  </div>
                  <div className="pz-billing-button-row" style={{ marginTop: 18 }}>
                    {subscription?.cancelAtPeriodEnd ? (
                      <button
                        type="button"
                        onClick={reactivateSubscription}
                        className="pz-super-button primary"
                        disabled={working === "reactivate"}
                      >
                        <RefreshCcw size={15} aria-hidden="true" />
                        Resume Auto-Renewal
                      </button>
                    ) : subscription?.status === "Active" ? (
                      <button
                        type="button"
                        onClick={() => setCancelModalOpen(true)}
                        className="pz-super-button danger"
                        disabled={working === "cancel"}
                      >
                        <XCircle size={15} aria-hidden="true" />
                        Cancel At Period End
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openCheckout(subscription?.planId || currentPlan?.id)}
                        className="pz-super-button primary"
                        disabled={working === "checkout" || !subscription?.planId}
                      >
                        <CreditCard size={15} aria-hidden="true" />
                        Start Stripe Checkout
                      </button>
                    )}
                  </div>
                </div>
              </section>

              <section className="pz-super-card">
                <div className="pz-super-card-header">
                  <div className="pz-super-card-title">Usage</div>
                  <span className="pz-super-badge blue">
                    <span className="pz-super-badge-dot" />
                    Live
                  </span>
                </div>
                <div style={{ padding: 22 }}>
                  <div className="pz-billing-detail-list">
                    <Detail label="Students" value={`${summary?.usage.students || 0}/${formatLimit(currentPlan?.maxStudents)}`} />
                    <Detail label="Families" value={`${summary?.usage.families || 0}/${formatLimit(currentPlan?.maxFamilies)}`} />
                    <Detail label="Guards" value={`${summary?.usage.guards || 0}/${formatLimit(currentPlan?.maxGuards)}`} />
                    <Detail label="Storage" value={formatStorageLimit(currentPlan?.storageLimitMb)} />
                  </div>
                </div>
              </section>
            </div>

            <section className="pz-super-card" style={{ marginBottom: 18 }}>
              <div className="pz-super-card-header">
                <div>
                  <div className="pz-super-card-title">Change Package</div>
                  <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                    Upgrades apply immediately with Stripe proration. Downgrades apply next cycle.
                  </div>
                </div>
                <div className="pz-billing-interval" aria-label="Billing interval">
                  <button
                    type="button"
                    className={billingInterval === "monthly" ? "active" : ""}
                    onClick={() => setBillingInterval("monthly")}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={billingInterval === "yearly" ? "active" : ""}
                    onClick={() => setBillingInterval("yearly")}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              <div style={{ padding: 22 }}>
                <div className="pz-billing-plan-grid">
                  {(summary?.plans || []).map((plan) => {
                    const isCurrent =
                      hasActivePaidSubscription &&
                      Number(plan.id) === Number(subscription?.planId) &&
                      billingInterval === subscription?.billingInterval;
                    const isPendingScheduled =
                      hasActivePaidSubscription &&
                      Boolean(subscription?.pendingPlanId) &&
                      Number(plan.id) === Number(subscription?.pendingPlanId);
                    const isSelectedUnpaid =
                      !hasActivePaidSubscription &&
                      Number(plan.id) === Number(subscription?.planId) &&
                      billingInterval === subscription?.billingInterval;
                    const price = billingInterval === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
                    const currentPrice = currentPlan
                      ? getPlanPrice(currentPlan, subscription?.billingInterval || billingInterval)
                      : 0;
                    const actionLabel = getPackageActionLabel({
                      hasActivePaidSubscription,
                      hasStripeSubscription: Boolean(subscription?.hasStripeSubscription),
                      isCurrent,
                      isPendingScheduled,
                      isSelectedUnpaid,
                      nextPrice: price,
                      currentPrice,
                    });
                    return (
                      <article className={`pz-billing-plan ${isCurrent ? "active" : ""}`} key={plan.id}>
                        <div className="pz-billing-plan-head">
                          <div>
                            <div className="pz-billing-plan-name">{plan.name}</div>
                            <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                              Grace {plan.gracePeriodDays} days
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="pz-super-badge green">
                              <span className="pz-super-badge-dot" />
                              Current
                            </span>
                          )}
                          {isPendingScheduled && (
                            <span className="pz-super-badge amber">
                              <span className="pz-super-badge-dot" />
                              Scheduled
                            </span>
                          )}
                          {isSelectedUnpaid && (
                            <span className="pz-super-badge amber">
                              <span className="pz-super-badge-dot" />
                              Checkout needed
                            </span>
                          )}
                        </div>
                        <div className="pz-billing-price">
                          {formatMoney(price)}
                          <span> / {billingInterval === "yearly" ? "year" : "month"}</span>
                        </div>
                        <div className="pz-billing-meta">
                          <div>Students: {formatLimit(plan.maxStudents)}</div>
                          <div>Families: {formatLimit(plan.maxFamilies)}</div>
                          <div>Guards: {formatLimit(plan.maxGuards)}</div>
                          <div>Storage: {formatStorageLimit(plan.storageLimitMb)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => (isSelectedUnpaid ? openCheckout(plan.id, billingInterval) : requestPlanChange(plan))}
                          className={isCurrent || isPendingScheduled ? "pz-super-button" : "pz-super-button primary"}
                          disabled={isCurrent || isPendingScheduled || working === `plan-${plan.id}` || working === "checkout"}
                          style={{ marginTop: "auto" }}
                        >
                          {working === `plan-${plan.id}` ? (
                            <LoadingSpinner size="xs" className="pz-loading-inline" />
                          ) : (
                            <CreditCard size={15} aria-hidden="true" />
                          )}
                          {actionLabel}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="pz-super-card">
              <div className="pz-super-card-header">
                <div>
                  <div className="pz-super-card-title">Invoices & Payments</div>
                  <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                    Recent Stripe invoices and payment records for your school.
                  </div>
                </div>
                <span className="pz-super-badge gray">
                  <span className="pz-super-badge-dot" />
                  {summary?.payments.length || 0} records
                </span>
              </div>
              <div className="pz-super-table-wrap">
                <table className="pz-super-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Reason</th>
                      <th>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.payments.length ? (
                      summary.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td>{formatDate(payment.paymentDate)}</td>
                          <td>{formatMoney(payment.amount)}</td>
                          <td>
                            <span className={`pz-super-badge ${statusClass(payment.status)}`}>
                              <span className="pz-super-badge-dot" />
                              {payment.status}
                            </span>
                          </td>
                          <td>
                            <div className="pz-super-entity-name">{formatReason(payment.billingReason)}</div>
                            {payment.failureReason && (
                              <div className="pz-super-entity-sub">{payment.failureReason}</div>
                            )}
                          </td>
                          <td>
                            <div className="pz-billing-button-row" style={{ justifyContent: "flex-start" }}>
                              {payment.invoiceHostedUrl ? (
                                <a className="pz-super-button" href={payment.invoiceHostedUrl} target="_blank" rel="noreferrer">
                                  <ExternalLink size={15} aria-hidden="true" />
                                  View
                                </a>
                              ) : (
                                <span className="pz-super-entity-sub">No hosted invoice</span>
                              )}
                              {payment.invoicePdfUrl && (
                                <a className="pz-super-button" href={payment.invoicePdfUrl} target="_blank" rel="noreferrer">
                                  <FileText size={15} aria-hidden="true" />
                                  PDF
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5}>
                          <div className="pz-super-empty">No payments have been recorded yet.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      {packageChangeIntent && (
        <PackageChangeModal
          intent={packageChangeIntent}
          billingInterval={billingInterval}
          currentPlanName={currentPlan?.name || subscription?.planName || "Current package"}
          working={working === `plan-${packageChangeIntent.plan.id}`}
          onClose={() => setPackageChangeIntent(null)}
          onConfirm={confirmPlanChange}
        />
      )}

      {cancelModalOpen && (
        <BillingActionModal
          title="Cancel Subscription"
          subtitle="The school keeps access until the current billing period ends."
          icon={<AlertTriangle size={20} aria-hidden="true" />}
          tone="danger"
          confirmLabel="Cancel At Period End"
          working={working === "cancel"}
          onClose={() => setCancelModalOpen(false)}
          onConfirm={cancelSubscription}
        >
          <div className="pz-billing-confirm-list">
            <ConfirmRow label="Current package" value={subscription?.planName || "No package"} />
            <ConfirmRow label="Access until" value={formatDate(subscription?.endDate || subscription?.nextBillingDate)} />
            <ConfirmRow label="Stripe action" value="Auto-renewal will stop at period end" />
          </div>
        </BillingActionModal>
      )}
    </DashboardLayout>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="pz-billing-detail">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon,
  tone,
  glow,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ReactNode;
  tone: CSSProperties;
  glow: string;
}) {
  return (
    <div className="pz-super-kpi-card" style={{ "--accent-glow": glow } as CSSProperties}>
      <div className="pz-super-kpi-top">
        <div className="pz-super-kpi-label">{label}</div>
        <div className="pz-super-kpi-icon" style={tone}>
          {icon}
        </div>
      </div>
      <div className="pz-super-kpi-value" style={{ fontSize: 24 }}>{value}</div>
      <div className="pz-super-kpi-footer">
        <CheckCircle2 aria-hidden="true" />
        <span>{helper}</span>
      </div>
    </div>
  );
}

type BillingNoticeModel = {
  title: string;
  message: string;
  actionLabel?: string;
};

function BillingNotice({
  notice,
  onCheckout,
  checkoutDisabled,
}: {
  notice: BillingNoticeModel;
  onCheckout: () => void;
  checkoutDisabled: boolean;
}) {
  return (
    <section className="pz-billing-notice">
      <div className="pz-billing-notice-main">
        <div className="pz-billing-notice-icon">
          <Info size={18} aria-hidden="true" />
        </div>
        <div>
          <div className="pz-billing-notice-title">{notice.title}</div>
          <div className="pz-billing-notice-copy">{notice.message}</div>
        </div>
      </div>
      {notice.actionLabel && (
        <button type="button" className="pz-super-button primary" onClick={onCheckout} disabled={checkoutDisabled}>
          <CreditCard size={15} aria-hidden="true" />
          {notice.actionLabel}
        </button>
      )}
    </section>
  );
}

function PackageChangeModal({
  intent,
  billingInterval,
  currentPlanName,
  working,
  onClose,
  onConfirm,
}: {
  intent: PackageChangeIntent;
  billingInterval: BillingInterval;
  currentPlanName: string;
  working: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isUpgrade = intent.changeType === "upgrade";
  const isDowngrade = intent.changeType === "downgrade";
  const title = isUpgrade ? "Confirm Package Upgrade" : isDowngrade ? "Schedule Package Downgrade" : "Confirm Package Change";
  const subtitle = isUpgrade
    ? "Stripe will charge the saved payment method for any prorated amount."
    : isDowngrade
      ? "The current package stays active until the next billing cycle."
      : "Stripe billing will be updated for the selected package.";
  const icon = isUpgrade ? <ArrowUpCircle size={20} aria-hidden="true" /> : <ArrowDownCircle size={20} aria-hidden="true" />;
  const confirmLabel = isUpgrade ? "Confirm Upgrade" : isDowngrade ? "Schedule Downgrade" : "Confirm Change";

  return (
    <BillingActionModal
      title={title}
      subtitle={subtitle}
      icon={icon}
      tone={isDowngrade ? "warning" : "primary"}
      confirmLabel={confirmLabel}
      working={working}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <div className="pz-billing-confirm-list">
        <ConfirmRow label="Current package" value={currentPlanName} />
        <ConfirmRow label="Selected package" value={intent.plan.name} />
        <ConfirmRow label="Billing interval" value={billingInterval} />
        <ConfirmRow label="Current price" value={formatMoney(intent.currentAmount)} />
        <ConfirmRow label="Selected price" value={formatMoney(intent.nextAmount)} />
        <ConfirmRow
          label="Stripe action"
          value={isUpgrade ? "Prorated charge may apply now" : isDowngrade ? "Scheduled for next cycle" : "Subscription will be updated"}
        />
      </div>
    </BillingActionModal>
  );
}

function BillingActionModal({
  title,
  subtitle,
  icon,
  tone = "primary",
  confirmLabel,
  working,
  onClose,
  onConfirm,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  tone?: "primary" | "warning" | "danger";
  confirmLabel: string;
  working: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: ReactNode;
}) {
  const iconClass = tone === "danger" ? "danger" : tone === "warning" ? "warn" : "";
  const confirmClass = tone === "danger" ? "pz-super-button danger" : "pz-super-button primary";

  return (
    <div className="pz-super-modal-overlay">
      <div className="pz-super-modal" role="dialog" aria-modal="true" aria-labelledby="billing-action-title">
        <div className="pz-super-modal-head">
          <div className="pz-super-modal-title-row">
            <div className={`pz-super-modal-icon ${iconClass}`}>{icon}</div>
            <div>
              <h2 className="pz-super-modal-title" id="billing-action-title">
                {title}
              </h2>
              <div className="pz-super-modal-subtitle">{subtitle}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="pz-super-modal-close" aria-label="Close" disabled={working}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="pz-super-modal-body">{children}</div>
        <div className="pz-super-modal-footer">
          <button type="button" onClick={onClose} className="pz-super-button" disabled={working}>
            Keep Current
          </button>
          <button type="button" onClick={onConfirm} className={confirmClass} disabled={working}>
            {working ? <LoadingSpinner size="xs" className="pz-loading-inline" /> : <CheckCircle2 size={15} aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="pz-billing-confirm-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function buildBillingNotice(
  subscription?: BillingSubscription | null,
  latestChange?: BillingPackageChange | null
): BillingNoticeModel | null {
  if (!subscription?.planName) return null;

  const changedBySuperAdmin = latestChange?.createdByRole === "super-admin";
  const actor = changedBySuperAdmin ? "Super Admin" : "The platform";

  if (!subscription.hasStripeSubscription) {
    return {
      title: `${actor} assigned ${subscription.planName}`,
      message: `Complete Stripe checkout to activate ${subscription.planName} for this school.`,
      actionLabel: "Complete Checkout",
    };
  }

  if (subscription.pendingPlanName) {
    return {
      title: changedBySuperAdmin ? "Super Admin scheduled a package change" : "Package change scheduled",
      message: `${subscription.pendingPlanName} is scheduled for ${formatDate(subscription.pendingChangeEffectiveAt)}. ${subscription.planName} remains active until then.`,
    };
  }

  if (changedBySuperAdmin && latestChange?.toPlanName === subscription.planName) {
    return {
      title: "Package updated by Super Admin",
      message: `Your school package is now ${subscription.planName}. Stripe billing has been updated for this subscription.`,
    };
  }

  return null;
}

function statusClass(status?: string | null) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active" || normalized === "successful") return "green";
  if (normalized === "expiring soon" || normalized === "pending") return "amber";
  if (normalized === "failed" || normalized === "inactive") return "red";
  return "gray";
}

function isActivePaidSubscription(subscription?: BillingSubscription | null) {
  if (!subscription?.hasStripeSubscription) return false;

  const normalized = String(subscription?.status || "").toLowerCase();
  if (normalized === "active" || normalized === "expiring soon") return true;

  if (subscription?.cancelAtPeriodEnd && subscription.endDate) {
    const endDate = new Date(subscription.endDate);
    return !Number.isNaN(endDate.getTime()) && endDate.getTime() >= Date.now();
  }

  return false;
}

function formatDate(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function getPlanPrice(plan: BillingPlan, interval: BillingInterval) {
  return interval === "yearly" ? Number(plan.yearlyPrice || 0) : Number(plan.monthlyPrice || 0);
}

function getPackageActionLabel({
  hasActivePaidSubscription,
  hasStripeSubscription,
  isCurrent,
  isPendingScheduled,
  isSelectedUnpaid,
  nextPrice,
  currentPrice,
}: {
  hasActivePaidSubscription: boolean;
  hasStripeSubscription: boolean;
  isCurrent: boolean;
  isPendingScheduled: boolean;
  isSelectedUnpaid: boolean;
  nextPrice: number;
  currentPrice: number;
}) {
  if (isCurrent) return "Active Package";
  if (isPendingScheduled) return "Downgrade Scheduled";
  if (isSelectedUnpaid) return "Complete Checkout";
  if (hasActivePaidSubscription && hasStripeSubscription) {
    if (nextPrice > currentPrice) return "Upgrade Package";
    if (nextPrice < currentPrice) return "Schedule Downgrade";
    return "Change Package";
  }
  return "Select Package";
}

function formatLimit(value?: number | null) {
  return value === null || value === undefined ? "Unlimited" : String(value);
}

function formatStorageLimit(value?: number | null) {
  return value === null || value === undefined ? "Unlimited" : `${value} MB`;
}

function formatReason(value?: string | null) {
  if (!value) return "Manual";
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
