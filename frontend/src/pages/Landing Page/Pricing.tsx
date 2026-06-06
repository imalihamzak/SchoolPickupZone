import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, CreditCard } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api/link'
import { toast } from '@/components/ui/toast'

type BillingInterval = 'monthly' | 'yearly'

type PublicPlan = {
  id: number
  name: string
  monthly_price: number
  yearly_price: number
  max_students: number | null
  max_families: number | null
  max_guards: number | null
  storage_limit_mb: number | null
  features: string[]
}

export default function PricingPlanSection() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly')
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/plans`)
        const data = await response.json()
        const activePlans = Array.isArray(data) ? data : []
        setPlans(activePlans)
        setSelectedPlanId(activePlans[0]?.id ?? null)
      } catch (err) {
        console.error(err)
        toast.error('Unable to load packages.')
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const handleChoosePlan = async (plan: PublicPlan) => {
    const token = localStorage.getItem('token')

    if (!token) {
      toast.info('School admin accounts are created by the platform team. Contact us to set up a school.')
      navigate('/contact')
      return
    }

    try {
      const checkoutRes = await fetch(`${API_BASE_URL}/superadmin/subscription/subscribe/create-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId: plan.id, billingInterval }),
      })

      const data = await checkoutRes.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to initiate checkout session')
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Try again.')
    }
  }

  return (
    <section id="plan" className="py-24 px-6 md:px-16 bg-transparent text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold">School Packages</h2>
            <p className="mt-2 text-sm text-white/65">Select a package during school onboarding, then complete billing in Stripe.</p>
          </div>
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 p-1">
            {(['monthly', 'yearly'] as BillingInterval[]).map((interval) => (
              <button
                key={interval}
                type="button"
                onClick={() => setBillingInterval(interval)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  billingInterval === interval ? 'bg-white text-slate-900' : 'text-white/70 hover:text-white'
                }`}
              >
                {interval === 'monthly' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-lg border border-white/15 bg-white/10 p-8 text-center text-white/70">
            Loading packages...
          </div>
        ) : plans.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const price = billingInterval === 'yearly' ? plan.yearly_price : plan.monthly_price
              const isSelected = selectedPlanId === plan.id
              const featureList = plan.features?.length ? plan.features : [
                `${formatLimit(plan.max_students)} students`,
                `${formatLimit(plan.max_families)} families`,
                `${formatLimit(plan.max_guards)} guards`,
              ]

              return (
                <article
                  key={plan.id}
                  className={`rounded-lg border bg-white p-6 text-slate-900 shadow-lg transition ${
                    isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-white/80'
                  }`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{formatStorage(plan.storage_limit_mb)} storage</p>
                    </div>
                    <CreditCard size={22} className="text-blue-500" aria-hidden="true" />
                  </div>

                  <div className="mt-5 text-3xl font-bold">
                    ${Number(price || 0).toFixed(0)}
                    <span className="text-sm font-medium text-slate-500">
                      /{billingInterval === 'yearly' ? 'year' : 'month'}
                    </span>
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-slate-700">
                    {featureList.slice(0, 6).map((feature) => (
                      <div key={feature} className="flex items-center gap-2">
                        <CheckCircle size={17} className="text-blue-500" aria-hidden="true" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="mt-6 w-full rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleChoosePlan(plan)
                    }}
                  >
                    Choose Package
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-white/15 bg-white/10 p-8 text-center text-white/70">
            No active packages are available.
          </div>
        )}
      </div>
    </section>
  )
}

function formatLimit(value: number | null) {
  return value === null || value === undefined ? 'Unlimited' : String(value)
}

function formatStorage(value: number | null) {
  return value === null || value === undefined ? 'Unlimited' : `${value} MB`
}
