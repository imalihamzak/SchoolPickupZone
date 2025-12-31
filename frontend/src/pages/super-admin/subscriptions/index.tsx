import { useEffect, useState } from 'react'
import axios from 'axios'
import DashboardLayout from '@/components/layouts/dashboard-layout'
import { SubscriptionList } from './components/SubscriptionList'
import { PaymentHistory } from './components/PaymentHistory'
import { PlanForm } from './components/PlanForm'
import { 
  CreditCardIcon, 
  PlusIcon, 
  BuildingLibraryIcon,
  ReceiptRefundIcon
} from '@heroicons/react/24/outline'
import type { Plan, Subscription, Payment } from './types/subscription.types'
import DeletePlanModal from './components/DeletePlanModal'
import { toast } from 'react-toastify'
import Loader from '../../../components/Loader';
import { API_BASE_URL } from '@/lib/api/link'

const tabs = [
  { id: 'plans', label: 'Subscription Plans', icon: BuildingLibraryIcon },
  { id: 'active', label: 'Active Subscriptions', icon: CreditCardIcon },
  { id: 'payments', label: 'Payment History', icon: ReceiptRefundIcon }
]

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('plans')
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscriptions: 0,
    totalPlans: 0,
  });
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/superadmin/overview`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setStats(response.data);
      } catch (error) {
        console.error('Failed to load overview stats:', error);
      }
    };
  
    fetchStats();
  }, []);
  
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/superadmin/payments`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
  
        const paymentsFromAPI = response.data.map((p: any) => ({
          id: p.id,
          amount: p.amount,
          status: p.status,
          method: p.method,
          date: p.payment_date?.slice(0, 10),
          transactionId: p.transaction_id,
          planName: p.plan_name,
          schoolName: p.school_name,
        }));
  
        setPayments(paymentsFromAPI);
      } catch (error) {
        console.error('Failed to load payments:', error);
      }
    };
  
    fetchPayments();
  }, []);
  
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/superadmin/subscriptions`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
  
        const subscriptionsFromAPI = response.data.map((sub: any) => ({
          id: sub.subscription_id,
          planId: sub.plan_id || 0, 
          adminName: sub.admin_name || 'Unknown Admin',
          schoolName: sub.school_name,
          status: sub.status?.toLowerCase() || 'expired',
          startDate: sub.start_date?.slice(0, 10) || '',
          endDate: sub.end_date?.slice(0, 10) || 'N/A',
          lastPayment: sub.last_payment_amount || 0,
          nextBilling: sub.next_billing_date?.slice(0, 10) || 'N/A',
        }));
  
        setSubscriptions(subscriptionsFromAPI);
      } catch (error) {
        console.error('Failed to load subscriptions:', error);
      }
    };
  
    fetchSubscriptions();
  }, []);
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const response = await axios.get(`${API_BASE_URL}/superadmin/plans`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
  
        const plansFromAPI = response.data.map((plan: any) => ({
          ...plan,
          interval: plan.billing_interval,
          features: plan.features ? plan.features.split(',').map((f: string) => f.trim()) : [],
        }));
  
        setPlans(plansFromAPI);
      } catch (error) {
        console.error('Failed to load plans:', error);
      } finally {
        setPlansLoading(false);
      }
    };
  
    fetchPlans();
  }, []);
  
  const getTotalRevenue = () => {
    return payments
      .filter(payment => payment.status === 'Successful')
      .reduce((sum, payment) => sum + payment.amount, 0)
  }

  const getActiveSubscriptions = () => {
    return subscriptions.filter(sub => sub.status === 'active').length
  }

  const onEdit = (plan: Plan) => {
    setSelectedPlan(plan)
    setShowPlanForm(true)
  }

  const onDelete = (plan: Plan) => {
    setPlanToDelete(plan)
    setShowDeleteModal(true)
  }
  
  return (
    <DashboardLayout role="super-admin">
      <div className="space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <CreditCardIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                      ${stats.totalRevenue}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <BuildingLibraryIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Subscriptions
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                      {stats.activeSubscriptions}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <ReceiptRefundIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Available Plans
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                      {stats.totalPlans}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-6 text-center border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'plans' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Subscription Plans</h2>
                  <button
                    onClick={() => setShowPlanForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create New Plan
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  {plansLoading ? (
    <div className="col-span-2">
      <Loader />
    </div>
  ) : plans.length > 0 ? (
    plans.map((plan) => (
      <div key={plan.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
            <div className="text-2xl font-bold text-primary-600">
              ${plan.price}<span className="text-sm text-gray-500">/{plan.interval}</span>
            </div>
          </div>
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Features</h4>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => onEdit(plan)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(plan)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ))
  ) : (
    <div className="col-span-2 text-center text-gray-500 py-6">
      No subscription plans available.
    </div>
  )}
</div>


              </div>
            )}

            {activeTab === 'active' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Active Subscriptions</h2>
                <SubscriptionList 
                  subscriptions={subscriptions}
                  onCancelSubscription={async (id) => {
                    if (window.confirm('Are you sure you want to cancel this subscription?')) {
                      try {
                        await axios.put(
                          `${API_BASE_URL}/superadmin/subscriptions/${id}/cancel`,
                          {},
                          {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem('token')}`,
                            },
                          }
                        );
                  
                        setSubscriptions(prev =>
                          prev.map(sub =>
                            sub.id === id ? { ...sub, status: 'cancelled' } : sub
                          )
                        );
                  
                        toast('Subscription cancelled.');
                      } catch (error) {
                        console.error('Cancel error:', error);
                        toast('Failed to cancel subscription.');
                      }
                    }
                  }}
                  
                />
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
                  <div className="flex items-center space-x-2">
                    <select className="border-2 border-gray-300 bg-white h-10 px-5 pr-10 rounded-lg text-sm focus:outline-none">
                      <option value="all">All Payments</option>
                      <option value="successful">Successful</option>
                      <option value="failed">Failed</option>
                      <option value="pending">Pending</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search..."
                      className="border-2 border-gray-300 bg-white h-10 px-5 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>
                <PaymentHistory payments={payments} />
              </div>
            )}
          </div>
        </div>

        {/* Plan Form Modal */}
        {showPlanForm && (
  <PlanForm
    plan={selectedPlan}
    onClose={() => {
      setShowPlanForm(false)
      setSelectedPlan(null)
    }}
    onSubmit={(data) => {
      if (selectedPlan) {
        console.log('Edit Plan:', { id: selectedPlan.id, ...data })
        // Update logic here
      } else {
        console.log('Create New Plan:', data)
        // Create logic here
      }
      setShowPlanForm(false)
      setSelectedPlan(null)
    }}
  />
)}

{showDeleteModal && planToDelete && (
  <DeletePlanModal
    isOpen={showDeleteModal}
    plan={planToDelete}
    onClose={() => {
      setShowDeleteModal(false)
      setPlanToDelete(null)
    }}
    onDelete={() => {
      setPlans(prev => prev.filter(p => p.id !== planToDelete.id))
      setShowDeleteModal(false)
      setPlanToDelete(null)
    }}
  />
)}


      </div>
    </DashboardLayout>
  )
}

// Helper functions for the plan card
function onEdit(plan: Plan) {
  console.log('Edit plan:', plan)
}

function onDelete(id: number) {
  console.log('Delete plan:', id)
}