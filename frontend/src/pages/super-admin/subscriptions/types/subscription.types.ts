export type FeatureToggleKey =
  | 'qr_verification'
  | 'guardian_management'
  | 'pickup_logs'
  | 'analytics'
  | 'document_uploads'
  | 'notifications'
  | 'device_authorization'

export interface Plan {
  id: number
  name: string
  price: number
  interval: 'monthly' | 'yearly'
  monthly_price: number
  yearly_price: number
  max_students: number | null
  max_families: number | null
  max_guards: number | null
  storage_limit_mb: number | null
  grace_period_days: number
  features: string[]
  feature_toggles: Record<FeatureToggleKey, boolean>
  is_active: boolean
}

export interface Subscription {
  id: number
  planId: number
  planName?: string
  adminId?: number // Optional if not included in query
  adminName: string
  schoolName: string
  schoolStatus?: 'Active' | 'Suspended'
  status: 'active' | 'cancelled' | 'expired' | 'inactive' | 'expiring soon'
  billingInterval?: 'monthly' | 'yearly'
  startDate: string
  endDate: string
  lastPayment: number
  nextBilling: string
  gracePeriodDays?: number
  failedPaymentCount?: number
  lastPaymentFailedAt?: string
  gracePeriodEndsAt?: string
  cancelAtPeriodEnd?: boolean
  cancelledAt?: string
  pendingPlanId?: number | null
  pendingPlanName?: string | null
  pendingBillingInterval?: 'monthly' | 'yearly' | null
  pendingChangeType?: 'upgrade' | 'downgrade' | null
  pendingChangeEffectiveAt?: string | null
  latestInvoiceId?: string | null
}


export interface Payment {
  id: number
  subscriptionId?: number 
  adminId?: number        
  adminName?: string
  amount: number
  status: 'Successful' | 'Failed' | 'Pending'
  date: string
  method: string
  planName: string      
  transactionId: string 
  schoolName: string
  stripeInvoiceId?: string | null
  stripeEventId?: string | null
  stripeChargeId?: string | null
  invoiceNumber?: string | null
  invoiceDueDate?: string | null
  invoiceHostedUrl?: string | null
  invoicePdfUrl?: string | null
  attemptCount?: number | null
  billingReason?: string | null
  failureReason?: string | null
}

export interface InvoiceRetry {
  id: number
  subscriptionId: number
  schoolId: number
  planId: number
  stripeInvoiceId: string
  stripeSubscriptionId?: string | null
  stripeEventId?: string | null
  attemptNumber: number
  amountDue: number
  scheduledAt: string
  processedAt?: string | null
  status: 'scheduled' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  errorMessage?: string | null
  schoolName?: string | null
  planName?: string | null
  billingInterval?: 'monthly' | 'yearly' | null
  subscriptionStatus?: string | null
}
