import React from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api/link'
import { toast } from 'react-toastify'

const features = [
  { text: 'All Admin Features Included', available: true },
  { text: 'Real-time QR Scan Notifications', available: true },
  { text: 'Secure Device Verification', available: true },
  { text: 'Unlimited Child/Guardian Profiles', available: true },
  { text: 'Priority Support & Analytics', available: true },
]

export default function PricingPlanSection() {
  const handleChoosePlan = async () => {
    const token = localStorage.getItem('token')

    if (!token) {
      toast.error('Please login as admin to subscribe')
      return
    }

    try {
      // Fetch schoolId of current logged-in admin
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const user = await res.json()
      const schoolId = user.school_id

      // You may hardcode planId = 1 for now
      const planId = 1

      const checkoutRes = await fetch(`${API_BASE_URL}/superadmin/subscription/subscribe/create-session`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ schoolId, planId }),
      })

      const data = await checkoutRes.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Failed to initiate checkout session')
      }
    } catch (err) {
      console.error(err)
      toast.error('Something went wrong. Try again.')
    }
  }

  return (
    <section id="plan" className="py-24 px-6 md:px-16 bg-transparent text-white">
      <div className="flex justify-center">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-sm overflow-hidden relative">

          {/* Curved Top */}
          <div className="bg-blue-500 text-white text-center py-6 relative rounded-b-[40px]">
            <h3 className="text-lg font-semibold">BASIC</h3>
            <div className="text-3xl font-bold mt-1">$19.99</div>
            <p className="text-sm">per month</p>
          </div>

          {/* Features List */}
          <div className="p-6 space-y-4 text-sm text-gray-700">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                {f.available ? (
                  <CheckCircle size={18} className="text-blue-500" />
                ) : (
                  <XCircle size={18} className="text-red-500" />
                )}
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Button */}
          <div className="text-center pb-6">
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium transition"
              onClick={handleChoosePlan}
            >
              Choose Now
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
