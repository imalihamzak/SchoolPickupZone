import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import axios from "axios";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  DollarSign,
  Layers3,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import DashboardLayout from "@/components/layouts/dashboard-layout";
import { AdminSelect } from "@/components/ui/admin-controls";
import { toast } from "@/components/ui/toast";
import Loader from "../../../components/Loader";
import { API_BASE_URL } from "@/lib/api/link";
import { SubscriptionList } from "./components/SubscriptionList";
import { PaymentHistory } from "./components/PaymentHistory";
import { PlanForm } from "./components/PlanForm";
import DeletePlanModal from "./components/DeletePlanModal";
import type { FeatureToggleKey, Plan, Subscription, Payment, InvoiceRetry } from "./types/subscription.types";
import "../super-admin-theme.css";

type TabId = "plans" | "active" | "payments" | "invoices";

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: "plans", label: "Packages", icon: <Layers3 size={15} aria-hidden="true" /> },
  { id: "active", label: "Subscriptions", icon: <CreditCard size={15} aria-hidden="true" /> },
  { id: "payments", label: "Payments", icon: <ReceiptText size={15} aria-hidden="true" /> },
  { id: "invoices", label: "Invoices", icon: <ReceiptText size={15} aria-hidden="true" /> },
];

const paymentStatusOptions = [
  { value: "all", label: "All Payments" },
  { value: "successful", label: "Successful" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
];

const billingReasonOptions = [
  { value: "all", label: "All Reasons" },
  { value: "subscription_create", label: "New Subscription" },
  { value: "subscription_cycle", label: "Recurring Cycle" },
  { value: "upgrade_proration", label: "Upgrade Proration" },
  { value: "failed_retry", label: "Failed Retry" },
  { value: "manual", label: "Manual" },
];

const subscriptionStatusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "expiring soon", label: "Expiring Soon" },
  { value: "inactive", label: "Inactive" },
  { value: "cancelled", label: "Cancelled" },
];

const billingIntervalOptions = [
  { value: "all", label: "All Billing" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const invoiceStatusOptions = [
  { value: "all", label: "Open And Failed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
];

const featureToggleKeys: FeatureToggleKey[] = [
  "qr_verification",
  "guardian_management",
  "pickup_logs",
  "analytics",
  "document_uploads",
  "notifications",
  "device_authorization",
];

const defaultFeatureToggles = featureToggleKeys.reduce(
  (acc, key) => {
    acc[key] = key !== "analytics";
    return acc;
  },
  {} as Record<FeatureToggleKey, boolean>
);

const normalizeFeatureToggles = (value: any): Record<FeatureToggleKey, boolean> => {
  const parsed = typeof value === "string" ? safeParseJson(value) : value;
  return featureToggleKeys.reduce(
    (acc, key) => {
      acc[key] = Boolean(parsed?.[key] ?? defaultFeatureToggles[key]);
      return acc;
    },
    {} as Record<FeatureToggleKey, boolean>
  );
};

const safeParseJson = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const normalizePlan = (plan: any): Plan => {
  const features = Array.isArray(plan.features)
    ? plan.features
    : plan.features
      ? String(plan.features).split(",").map((feature: string) => feature.trim()).filter(Boolean)
      : [];
  const monthlyPrice = Number(plan.monthly_price ?? plan.monthlyPrice ?? plan.price ?? 0);
  const yearlyPrice = Number(plan.yearly_price ?? plan.yearlyPrice ?? 0);

  return {
    ...plan,
    price: monthlyPrice,
    interval: plan.billing_interval || plan.interval || "monthly",
    monthly_price: monthlyPrice,
    yearly_price: yearlyPrice,
    max_students: plan.max_students ?? null,
    max_families: plan.max_families ?? null,
    max_guards: plan.max_guards ?? null,
    storage_limit_mb: plan.storage_limit_mb ?? null,
    grace_period_days: Number(plan.grace_period_days ?? 7),
    features,
    feature_toggles: normalizeFeatureToggles(plan.feature_toggles),
    is_active: Boolean(plan.is_active ?? true),
  };
};

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("plans");
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoiceRetries, setInvoiceRetries] = useState<InvoiceRetry[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [subscriptionToCancel, setSubscriptionToCancel] = useState<Subscription | null>(null);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentReasonFilter, setPaymentReasonFilter] = useState("all");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState("all");
  const [subscriptionBillingFilter, setSubscriptionBillingFilter] = useState("all");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("all");
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalPlans: 0,
    pendingRevenue: 0,
    failedPayments: 0,
    successfulPayments: 0,
    paymentSuccessRate: 0,
    outstandingInvoices: 0,
  });
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [retriesLoading, setRetriesLoading] = useState(true);
  const [processingRetries, setProcessingRetries] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/superadmin/overview`, {
        headers: authHeaders(),
      });
      setStats({
        totalRevenue: numberValue(response.data.totalRevenue),
        activeSubscriptions: numberValue(response.data.activeSubscriptions),
        totalPlans: numberValue(response.data.totalPlans),
        pendingRevenue: numberValue(response.data.pendingRevenue),
        failedPayments: numberValue(response.data.failedPayments),
        successfulPayments: numberValue(response.data.successfulPayments),
        paymentSuccessRate: numberValue(response.data.paymentSuccessRate),
        outstandingInvoices: numberValue(response.data.outstandingInvoices),
      });
    } catch (error) {
      console.error("Failed to load overview stats:", error);
    }
  };

  const fetchPayments = async () => {
    try {
      setPaymentsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/superadmin/payments`, {
        headers: authHeaders(),
      });

      const paymentsFromAPI = response.data.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        method: p.method,
        date: p.payment_date?.slice(0, 10),
        transactionId: p.transaction_id,
        stripeInvoiceId: p.stripe_invoice_id,
        stripeEventId: p.stripe_event_id,
        stripeChargeId: p.stripe_charge_id,
        invoiceNumber: p.invoice_number,
        invoiceDueDate: p.invoice_due_date?.slice(0, 10) || null,
        invoiceHostedUrl: p.invoice_hosted_url,
        invoicePdfUrl: p.invoice_pdf_url,
        attemptCount: p.attempt_count ?? null,
        planName: p.plan_name,
        schoolName: p.school_name,
        billingReason: p.billing_reason,
        failureReason: p.failure_reason,
      }));

      setPayments(paymentsFromAPI);
    } catch (error) {
      console.error("Failed to load payments:", error);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchInvoiceRetries = async () => {
    try {
      setRetriesLoading(true);
      const response = await axios.get(`${API_BASE_URL}/superadmin/billing/retries`, {
        headers: authHeaders(),
      });

      const retriesFromAPI = response.data.map((retry: any) => ({
        id: retry.id,
        subscriptionId: retry.subscription_id,
        schoolId: retry.school_id,
        planId: retry.plan_id,
        stripeInvoiceId: retry.stripe_invoice_id,
        stripeSubscriptionId: retry.stripe_subscription_id,
        stripeEventId: retry.stripe_event_id,
        attemptNumber: Number(retry.attempt_number || 0),
        amountDue: Number(retry.amount_due || 0),
        scheduledAt: retry.scheduled_at,
        processedAt: retry.processed_at || null,
        status: retry.status,
        errorMessage: retry.error_message || null,
        schoolName: retry.school_name || null,
        planName: retry.plan_name || null,
        billingInterval: retry.billing_interval || null,
        subscriptionStatus: retry.subscription_status || null,
      }));

      setInvoiceRetries(retriesFromAPI);
    } catch (error) {
      console.error("Failed to load invoice retries:", error);
    } finally {
      setRetriesLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setSubscriptionsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/superadmin/subscriptions`, {
        headers: authHeaders(),
      });

      const subscriptionsFromAPI = response.data.map((sub: any) => ({
        id: sub.subscription_id,
        planId: sub.plan_id || 0,
        planName: sub.plan_name || "No package",
        adminName: sub.admin_name || "Unknown Admin",
        schoolName: sub.school_name,
        schoolStatus: sub.school_status || "Active",
        status: sub.status?.toLowerCase() || "expired",
        billingInterval: sub.billing_interval || "monthly",
        startDate: sub.start_date?.slice(0, 10) || "",
        endDate: sub.end_date?.slice(0, 10) || "N/A",
        lastPayment: sub.last_payment_amount || 0,
        nextBilling: sub.next_billing_date?.slice(0, 10) || "N/A",
        gracePeriodDays: sub.grace_period_days ?? 7,
        failedPaymentCount: sub.failed_payment_count || 0,
        lastPaymentFailedAt: sub.last_payment_failed_at?.slice(0, 10) || "",
        gracePeriodEndsAt: sub.grace_period_ends_at?.slice(0, 10) || "",
        cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
        cancelledAt: sub.cancelled_at?.slice(0, 10) || "",
        pendingPlanId: sub.pending_plan_id || null,
        pendingPlanName: sub.pending_plan_name || null,
        pendingBillingInterval: sub.pending_billing_interval || null,
        pendingChangeType: sub.pending_change_type || null,
        pendingChangeEffectiveAt: sub.pending_change_effective_at?.slice(0, 10) || null,
        latestInvoiceId: sub.latest_invoice_id || null,
      }));

      setSubscriptions(subscriptionsFromAPI);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const response = await axios.get(`${API_BASE_URL}/superadmin/plans`, {
        headers: authHeaders(),
      });

      const plansFromAPI = response.data.map(normalizePlan);

      setPlans(plansFromAPI);
    } catch (error) {
      console.error("Failed to load plans:", error);
    } finally {
      setPlansLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPayments();
    fetchInvoiceRetries();
    fetchSubscriptions();
    fetchPlans();
  }, []);

  const filteredPayments = useMemo(() => {
    const query = paymentSearch.trim().toLowerCase();

    return payments.filter((payment) => {
      const statusMatches =
        paymentStatusFilter === "all" || payment.status.toLowerCase() === paymentStatusFilter;
      const reasonMatches =
        paymentReasonFilter === "all" || payment.billingReason === paymentReasonFilter;
      const queryMatches =
        !query ||
        payment.schoolName?.toLowerCase().includes(query) ||
        payment.planName?.toLowerCase().includes(query) ||
        payment.transactionId?.toLowerCase().includes(query) ||
        payment.method?.toLowerCase().includes(query) ||
        payment.invoiceNumber?.toLowerCase().includes(query) ||
        payment.stripeInvoiceId?.toLowerCase().includes(query);

      return statusMatches && reasonMatches && queryMatches;
    });
  }, [payments, paymentReasonFilter, paymentSearch, paymentStatusFilter]);

  const filteredSubscriptions = useMemo(() => {
    const query = subscriptionSearch.trim().toLowerCase();

    return subscriptions.filter((subscription) => {
      const statusMatches =
        subscriptionStatusFilter === "all" || subscription.status === subscriptionStatusFilter;
      const billingMatches =
        subscriptionBillingFilter === "all" || subscription.billingInterval === subscriptionBillingFilter;
      const queryMatches =
        !query ||
        subscription.schoolName?.toLowerCase().includes(query) ||
        subscription.adminName?.toLowerCase().includes(query) ||
        subscription.planName?.toLowerCase().includes(query) ||
        subscription.latestInvoiceId?.toLowerCase().includes(query);

      return statusMatches && billingMatches && queryMatches;
    });
  }, [subscriptionBillingFilter, subscriptionSearch, subscriptionStatusFilter, subscriptions]);

  const invoicePayments = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase();

    return payments.filter((payment) => {
      const normalizedStatus = payment.status.toLowerCase();
      const isInvoice = normalizedStatus === "pending" || normalizedStatus === "failed";
      const statusMatches = invoiceStatusFilter === "all" || normalizedStatus === invoiceStatusFilter;
      const queryMatches =
        !query ||
        payment.schoolName?.toLowerCase().includes(query) ||
        payment.planName?.toLowerCase().includes(query) ||
        payment.transactionId?.toLowerCase().includes(query) ||
        payment.invoiceNumber?.toLowerCase().includes(query) ||
        payment.stripeInvoiceId?.toLowerCase().includes(query);

      return isInvoice && statusMatches && queryMatches;
    });
  }, [invoiceSearch, invoiceStatusFilter, payments]);

  const filteredInvoiceRetries = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase();

    return invoiceRetries.filter((retry) => {
      const queryMatches =
        !query ||
        retry.schoolName?.toLowerCase().includes(query) ||
        retry.planName?.toLowerCase().includes(query) ||
        retry.stripeInvoiceId?.toLowerCase().includes(query) ||
        retry.stripeEventId?.toLowerCase().includes(query);

      return queryMatches;
    });
  }, [invoiceRetries, invoiceSearch]);

  const retrySummary = useMemo(() => {
    const now = Date.now();
    return {
      scheduled: invoiceRetries.filter((retry) => retry.status === "scheduled").length,
      dueNow: invoiceRetries.filter(
        (retry) => retry.status === "scheduled" && new Date(retry.scheduledAt).getTime() <= now
      ).length,
      failed: invoiceRetries.filter((retry) => retry.status === "failed").length,
      succeeded: invoiceRetries.filter((retry) => retry.status === "succeeded").length,
    };
  }, [invoiceRetries]);

  const activeSubscriptionCount = useMemo(
    () => subscriptions.filter((sub) => sub.status === "active").length,
    [subscriptions]
  );

  const filteredOutstandingAmount = useMemo(
    () => {
      const uniqueInvoices = new Map<string, number>();
      invoicePayments.forEach((payment) => {
        const key = payment.stripeInvoiceId || payment.transactionId || String(payment.id);
        uniqueInvoices.set(key, Math.max(uniqueInvoices.get(key) || 0, Number(payment.amount || 0)));
      });
      return Array.from(uniqueInvoices.values()).reduce((sum, amount) => sum + amount, 0);
    },
    [invoicePayments]
  );

  const confirmCancelSubscription = async () => {
    if (!subscriptionToCancel) return;

    try {
      await axios.put(
        `${API_BASE_URL}/superadmin/subscriptions/${subscriptionToCancel.id}/cancel`,
        {},
        {
          headers: authHeaders(),
        }
      );

      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub.id === subscriptionToCancel.id ? { ...sub, status: "cancelled" } : sub
        )
      );
      setSubscriptionToCancel(null);
      toast.success("Subscription cancelled.");
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel subscription.");
    }
  };

  const reactivateSubscription = async (id: number) => {
    try {
      await axios.put(
        `${API_BASE_URL}/superadmin/subscriptions/${id}/reactivate`,
        {},
        {
          headers: authHeaders(),
        }
      );

      await fetchSubscriptions();
      await fetchStats();
      toast.success("Subscription reactivated.");
    } catch (error) {
      console.error("Reactivate error:", error);
      toast.error("Failed to reactivate subscription.");
    }
  };

  const processDueRetries = async () => {
    try {
      setProcessingRetries(true);
      const response = await axios.post(
        `${API_BASE_URL}/superadmin/billing/process-retries`,
        { limit: 25 },
        { headers: authHeaders() }
      );

      await Promise.all([fetchInvoiceRetries(), fetchPayments(), fetchStats(), fetchSubscriptions()]);
      toast.success(`Processed ${response.data?.processed || 0} due retry attempt(s).`);
    } catch (error: any) {
      console.error("Retry processor error:", error);
      toast.error(error.response?.data?.error || "Failed to process due retries.");
    } finally {
      setProcessingRetries(false);
    }
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    try {
      await axios.delete(`${API_BASE_URL}/superadmin/plans/${planToDelete.id}`, {
        headers: authHeaders(),
      });

      setPlans((prev) => prev.filter((plan) => plan.id !== planToDelete.id));
      setShowDeleteModal(false);
      setPlanToDelete(null);
      fetchStats();
      toast.success("Package deleted.");
    } catch (error: any) {
      const message = error.response?.data?.error || "Failed to delete package.";
      toast.error(message);
    }
  };

  const closePlanForm = () => {
    setShowPlanForm(false);
    setSelectedPlan(null);
  };

  return (
    <DashboardLayout role="super-admin">
      <div className="pz-super-page">
        <div className="pz-super-header">
          <div>
            <div className="pz-super-kicker">Platform Billing</div>
            <h1 className="pz-super-title">Subscriptions</h1>
            <div className="pz-super-subtitle">
              Manage school packages, active billing, and payment records.
            </div>
          </div>
          <div className="pz-super-actions">
            <div className="pz-super-date-pill">
              <CalendarDays size={15} aria-hidden="true" />
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedPlan(null);
                setShowPlanForm(true);
              }}
              className="pz-super-button primary"
            >
              <Plus size={15} aria-hidden="true" />
              Create Package
            </button>
          </div>
        </div>

        <div className="pz-super-kpi-grid compact">
          <SummaryCard
            label="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            helper="Recorded platform revenue"
            icon={<DollarSign aria-hidden="true" />}
            tone={{ background: "#EFF6FF", color: "#1B6ECC" }}
            glow="rgba(27,110,204,0.16)"
          />
          <SummaryCard
            label="Active Subscriptions"
            value={stats.activeSubscriptions || activeSubscriptionCount}
            helper="Schools currently billed"
            icon={<ShieldCheck aria-hidden="true" />}
            tone={{ background: "#E1F5EE", color: "#1A9E75" }}
            glow="rgba(26,158,117,0.16)"
          />
          <SummaryCard
            label="Available Packages"
            value={stats.totalPlans || plans.length}
            helper="Configurable school packages"
            icon={<Layers3 aria-hidden="true" />}
            tone={{ background: "#FEF3DC", color: "#EF9F27" }}
            glow="rgba(239,159,39,0.16)"
          />
          <SummaryCard
            label="Outstanding Invoices"
            value={stats.outstandingInvoices}
            helper={`${formatCurrency(stats.pendingRevenue)} open or failed`}
            icon={<ReceiptText aria-hidden="true" />}
            tone={{ background: "#FDEAEA", color: "#E24B4A" }}
            glow="rgba(226,75,74,0.14)"
          />
          <SummaryCard
            label="Payment Success"
            value={`${stats.paymentSuccessRate}%`}
            helper={`${stats.failedPayments} failed retry log${stats.failedPayments === 1 ? "" : "s"}`}
            icon={<CheckCircle2 aria-hidden="true" />}
            tone={{ background: "#E1F5EE", color: "#1A9E75" }}
            glow="rgba(26,158,117,0.16)"
          />
          <SummaryCard
            label="Filtered Invoice Total"
            value={formatCurrency(filteredOutstandingAmount)}
            helper={`${invoicePayments.length} invoice row${invoicePayments.length === 1 ? "" : "s"} in view`}
            icon={<ReceiptText aria-hidden="true" />}
            tone={{ background: "#F4F6FA", color: "#0B2E5A" }}
            glow="rgba(7,29,59,0.14)"
          />
        </div>

        <section className="pz-super-card">
          <div className="pz-super-card-header">
            <div>
              <div className="pz-super-card-title">Billing Workspace</div>
              <div className="pz-super-subtitle" style={{ marginTop: 4 }}>
                Packages, subscriptions, and payment activity in one place.
              </div>
            </div>
            <div className="pz-super-tabs" role="tablist" aria-label="Subscription tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pz-super-tab ${activeTab === tab.id ? "active" : ""}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "plans" && (
            <div className="pz-super-modal-body">
              <div className="pz-super-plan-grid">
                {plansLoading ? (
                  <div className="pz-super-loading" style={{ gridColumn: "1 / -1" }}>
                    <Loader />
                  </div>
                ) : plans.length ? (
                  plans.map((plan) => (
                    <div key={plan.id} className="pz-super-plan-card">
                      <div className="pz-super-plan-top">
                        <div>
                          <div className="pz-super-plan-name">{plan.name}</div>
                          <div className="pz-super-subtitle" style={{ marginTop: 5 }}>
                            {enabledFeatureCount(plan)} module{enabledFeatureCount(plan) === 1 ? "" : "s"} enabled
                          </div>
                        </div>
                        <div className="pz-super-plan-price">
                          ${plan.monthly_price}
                          <span>/monthly</span>
                        </div>
                      </div>

                      <div className="pz-super-plan-meta">
                        <PlanMeta label="Yearly" value={`$${plan.yearly_price}`} />
                        <PlanMeta label="Students" value={formatLimit(plan.max_students)} />
                        <PlanMeta label="Families" value={formatLimit(plan.max_families)} />
                        <PlanMeta label="Guards" value={formatLimit(plan.max_guards)} />
                        <PlanMeta label="Storage" value={formatStorage(plan.storage_limit_mb)} />
                        <PlanMeta label="Grace" value={`${plan.grace_period_days} days`} />
                        <PlanMeta label="Status" value={plan.is_active ? "Active" : "Inactive"} />
                      </div>

                      <ul className="pz-super-feature-list">
                        {plan.features.length ? (
                          plan.features.map((feature, index) => (
                            <li key={`${feature}-${index}`}>
                              <CheckCircle2 size={15} aria-hidden="true" />
                              <span>{feature}</span>
                            </li>
                          ))
                        ) : (
                          <li>
                            <CheckCircle2 size={15} aria-hidden="true" />
                            <span>No features listed yet.</span>
                          </li>
                        )}
                      </ul>

                      <div className="pz-super-plan-actions">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setShowPlanForm(true);
                          }}
                          className="pz-super-button"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPlanToDelete(plan);
                            setShowDeleteModal(true);
                          }}
                          className="pz-super-button danger"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="pz-super-empty" style={{ gridColumn: "1 / -1" }}>
                    No subscription packages available.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "active" && (
            <div>
              <div className="pz-super-toolbar">
                <div className="pz-super-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search school, admin, package, or invoice..."
                    value={subscriptionSearch}
                    onChange={(event) => setSubscriptionSearch(event.target.value)}
                  />
                </div>
                <AdminSelect
                  value={subscriptionStatusFilter}
                  onChange={setSubscriptionStatusFilter}
                  options={subscriptionStatusOptions}
                  ariaLabel="Subscription status"
                />
                <AdminSelect
                  value={subscriptionBillingFilter}
                  onChange={setSubscriptionBillingFilter}
                  options={billingIntervalOptions}
                  ariaLabel="Billing interval"
                />
                <button
                  type="button"
                  className="pz-super-button"
                  onClick={() => exportSubscriptions(filteredSubscriptions)}
                >
                  <Download size={15} aria-hidden="true" />
                  Export
                </button>
              </div>
              {subscriptionsLoading ? (
                <div className="pz-super-loading">
                  <Loader />
                </div>
              ) : (
                <SubscriptionList
                  subscriptions={filteredSubscriptions}
                  onCancelSubscription={(id) => {
                    const selected = subscriptions.find((subscription) => subscription.id === id);
                    if (selected) setSubscriptionToCancel(selected);
                  }}
                  onReactivateSubscription={reactivateSubscription}
                />
              )}
            </div>
          )}

          {activeTab === "payments" && (
            <div>
              <div className="pz-super-toolbar">
                <div className="pz-super-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search school, plan, transaction, or method..."
                    value={paymentSearch}
                    onChange={(event) => setPaymentSearch(event.target.value)}
                  />
                </div>
                <AdminSelect
                  value={paymentStatusFilter}
                  onChange={setPaymentStatusFilter}
                  options={paymentStatusOptions}
                  ariaLabel="Payment status"
                />
                <AdminSelect
                  value={paymentReasonFilter}
                  onChange={setPaymentReasonFilter}
                  options={billingReasonOptions}
                  ariaLabel="Billing reason"
                />
                <button
                  type="button"
                  className="pz-super-button"
                  onClick={() => exportPayments(filteredPayments, "payments")}
                >
                  <Download size={15} aria-hidden="true" />
                  Export
                </button>
              </div>
              {paymentsLoading ? (
                <div className="pz-super-loading">
                  <Loader />
                </div>
              ) : (
                <PaymentHistory payments={filteredPayments} />
              )}
            </div>
          )}

          {activeTab === "invoices" && (
            <div>
              <div className="pz-super-toolbar">
                <div className="pz-super-search">
                  <Search size={16} aria-hidden="true" />
                  <input
                    type="text"
                    placeholder="Search school, package, invoice, or transaction..."
                    value={invoiceSearch}
                    onChange={(event) => setInvoiceSearch(event.target.value)}
                  />
                </div>
                <AdminSelect
                  value={invoiceStatusFilter}
                  onChange={setInvoiceStatusFilter}
                  options={invoiceStatusOptions}
                  ariaLabel="Invoice status"
                />
                <button
                  type="button"
                  className="pz-super-button"
                  onClick={processDueRetries}
                  disabled={processingRetries || retriesLoading}
                >
                  <CheckCircle2 size={15} aria-hidden="true" />
                  {processingRetries ? "Processing..." : "Process Due Retries"}
                </button>
                <button
                  type="button"
                  className="pz-super-button"
                  onClick={() => exportPayments(invoicePayments, "invoices")}
                >
                  <Download size={15} aria-hidden="true" />
                  Export
                </button>
              </div>
              <div className="pz-super-report-strip">
                <ReportMetric label="Invoice rows" value={invoicePayments.length} />
                <ReportMetric label="Amount in view" value={formatCurrency(filteredOutstandingAmount)} />
                <ReportMetric label="Scheduled retries" value={retrySummary.scheduled} />
                <ReportMetric label="Due now" value={retrySummary.dueNow} />
                <ReportMetric label="Failed retries" value={retrySummary.failed} />
                <ReportMetric label="Recovered retries" value={retrySummary.succeeded} />
              </div>
              {paymentsLoading ? (
                <div className="pz-super-loading">
                  <Loader />
                </div>
              ) : (
                <PaymentHistory payments={invoicePayments} />
              )}
              <InvoiceRetryTable retries={filteredInvoiceRetries} loading={retriesLoading} />
            </div>
          )}
        </section>
      </div>

      {showPlanForm && (
        <PlanForm
          plan={selectedPlan}
          onClose={closePlanForm}
          onSubmit={() => {
            fetchPlans();
            fetchStats();
            closePlanForm();
          }}
        />
      )}

      {showDeleteModal && planToDelete && (
        <DeletePlanModal
          isOpen={showDeleteModal}
          plan={planToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setPlanToDelete(null);
          }}
          onDelete={confirmDeletePlan}
        />
      )}

      {subscriptionToCancel && (
        <div className="pz-super-modal-overlay">
          <div className="pz-super-modal sm" role="dialog" aria-modal="true" aria-labelledby="cancel-subscription-title">
            <div className="pz-super-modal-head">
              <div className="pz-super-modal-title-row">
                <div className="pz-super-modal-icon danger">
                  <Trash2 size={20} aria-hidden="true" />
                </div>
                <div>
                  <h2 className="pz-super-modal-title" id="cancel-subscription-title">
                    Cancel Subscription
                  </h2>
                  <div className="pz-super-modal-subtitle">
                    The existing cancel API will mark this subscription as cancelled.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubscriptionToCancel(null)}
                className="pz-super-modal-close"
                aria-label="Close"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="pz-super-modal-body">
              <div className="pz-super-form">
                <div>
                  <div className="pz-super-section-title">Confirm cancellation</div>
                  <div className="pz-super-subtitle" style={{ marginTop: 0 }}>
                    Cancel billing for <strong>{subscriptionToCancel.schoolName}</strong>. The subscription will
                    remain visible with cancelled status.
                  </div>
                </div>
                <div className="pz-super-note">Last payment: ${subscriptionToCancel.lastPayment}</div>
              </div>
            </div>

            <div className="pz-super-modal-footer">
              <button type="button" onClick={() => setSubscriptionToCancel(null)} className="pz-super-button">
                Keep Active
              </button>
              <button type="button" onClick={confirmCancelSubscription} className="pz-super-button danger">
                <Trash2 size={15} aria-hidden="true" />
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
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
  value: string | number;
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
      <div className="pz-super-kpi-value">{value}</div>
      <div className="pz-super-kpi-footer">
        <CheckCircle2 aria-hidden="true" />
        <span>{helper}</span>
      </div>
    </div>
  );
}

function ReportMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pz-super-report-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InvoiceRetryTable({ retries, loading }: { retries: InvoiceRetry[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="pz-super-loading" style={{ minHeight: 120 }}>
        <Loader />
      </div>
    );
  }

  if (!retries.length) {
    return (
      <div className="pz-super-empty" style={{ minHeight: 120 }}>
        No retry attempts match the current filters.
      </div>
    );
  }

  return (
    <div className="pz-super-table-wrap" style={{ marginTop: 18 }}>
      <table className="pz-super-table">
        <thead>
          <tr>
            <th>School</th>
            <th>Package</th>
            <th>Invoice</th>
            <th>Attempt</th>
            <th>Scheduled</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {retries.map((retry) => (
            <tr key={retry.id}>
              <td>{retry.schoolName || "Unknown school"}</td>
              <td>{retry.planName || "No package"}</td>
              <td>{retry.stripeInvoiceId || "N/A"}</td>
              <td>{retry.attemptNumber}</td>
              <td>{formatDateTime(retry.scheduledAt)}</td>
              <td>
                <span className={`pz-super-badge ${retry.status === "succeeded" ? "green" : retry.status === "failed" ? "red" : "amber"}`}>
                  {retry.status}
                </span>
              </td>
              <td>{formatCurrency(retry.amountDue)}</td>
              <td>{retry.errorMessage || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlanMeta({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pz-super-plan-meta-item">
      <div className="pz-super-plan-meta-label">{label}</div>
      <div className="pz-super-plan-meta-value">{value}</div>
    </div>
  );
}

function enabledFeatureCount(plan: Plan) {
  return Object.values(plan.feature_toggles || {}).filter(Boolean).length;
}

function formatLimit(value: number | null) {
  return value === null || value === undefined ? "Unlimited" : value;
}

function formatStorage(value: number | null) {
  return value === null || value === undefined ? "Unlimited" : `${value} MB`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function numberValue(value: unknown) {
  const normalized = Number(value ?? 0);
  return Number.isFinite(normalized) ? normalized : 0;
}

function exportSubscriptions(subscriptions: Subscription[]) {
  const rows: Array<Array<string | number>> = [
    ["School", "Admin", "Package", "Status", "Billing", "Start", "End", "Next Billing", "Last Payment", "Failed Payments", "Latest Invoice"],
    ...subscriptions.map((subscription) => [
      subscription.schoolName,
      subscription.adminName,
      subscription.planName || "",
      subscription.status,
      subscription.billingInterval || "",
      subscription.startDate || "",
      subscription.endDate || "",
      subscription.nextBilling || "",
      subscription.lastPayment,
      subscription.failedPaymentCount || 0,
      subscription.latestInvoiceId || "",
    ]),
  ];

  downloadCsv(`subscriptions-report-${todayStamp()}.csv`, rows);
}

function exportPayments(payments: Payment[], reportName: string) {
  const rows: Array<Array<string | number>> = [
    ["School", "Package", "Invoice", "Stripe Invoice ID", "Date", "Due Date", "Amount", "Status", "Method", "Reason", "Attempt", "Transaction", "Stripe Event", "Failure"],
    ...payments.map((payment) => [
      payment.schoolName,
      payment.planName,
      payment.invoiceNumber || "",
      payment.stripeInvoiceId || "",
      payment.date || "",
      payment.invoiceDueDate || "",
      payment.amount,
      payment.status,
      payment.method || "",
      payment.billingReason || "",
      payment.attemptCount || "",
      payment.transactionId || "",
      payment.stripeEventId || "",
      payment.failureReason || "",
    ]),
  ];

  downloadCsv(`${reportName}-report-${todayStamp()}.csv`, rows);
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function todayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}
