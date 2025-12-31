import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/link'
import { EnvelopeIcon, ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { EnvelopeIcon as EnvelopeSolid } from '@heroicons/react/24/solid'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email })
      toast.success('Reset link sent. Check your inbox.')
      setEmailSent(true)
      setEmail('')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error sending reset link.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 sm:p-10 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <img className="mx-auto h-16 w-auto mb-4" src="/logo.png" alt="School Pickup" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password?</h2>
          <p className="text-sm text-gray-500">
            {emailSent 
              ? "We've sent a reset link to your email" 
              : "No worries! Enter your email and we'll send you a reset link."
            }
          </p>
        </div>

        {emailSent ? (
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <EnvelopeSolid className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Your Email</h3>
              <p className="text-sm text-gray-600">
                We've sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password.
              </p>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <Link to="/login">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-sm"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Enter the email address associated with your account
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full py-3 rounded-lg text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-5 w-5" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <Link to="/login">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
