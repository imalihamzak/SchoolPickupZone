import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import axios from 'axios'
import { API_BASE_URL } from '@/lib/api/link'
import { 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const getPasswordStrength = (password: string) => {
    if (password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)) return 'strong'
    if (password.length >= 6) return 'medium'
    return 'weak'
  }
  const passwordStrength = getPasswordStrength(password)
  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const passwordsMismatch = confirmPassword && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!passwordsMatch) {
      toast.error('Passwords do not match')
      return
    }

    if (!token) {
      toast.error('Invalid reset token')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_BASE_URL}/auth/reset-password`, { token, newPassword: password })
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 sm:p-10 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <img className="mx-auto h-16 w-auto mb-4" src="/logo.png" alt="School Pickup" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Set New Password</h2>
          <p className="text-sm text-gray-500">
            Create a strong password to secure your account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs">
                  {passwordStrength === 'weak' && (
                    <>
                      <XCircleIcon className="h-4 w-4 text-red-500" />
                      <span className="text-red-500 font-medium">Weak Password</span>
                    </>
                  )}
                  {passwordStrength === 'medium' && (
                    <>
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-600 font-medium">Medium Strength</span>
                    </>
                  )}
                  {passwordStrength === 'strong' && (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">Strong Password</span>
                    </>
                  )}
                </div>
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={clsx(
                    'h-full transition-all duration-300',
                    passwordStrength === 'weak' && 'w-1/3 bg-red-500',
                    passwordStrength === 'medium' && 'w-2/3 bg-yellow-500',
                    passwordStrength === 'strong' && 'w-full bg-green-500'
                  )}></div>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Use at least 8 characters with uppercase, lowercase, and numbers
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className={clsx(
                  'block w-full pl-10 pr-10 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 transition-all text-sm',
                  passwordsMismatch 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : passwordsMatch
                    ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                    : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            {confirmPassword && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {passwordsMatch ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="font-medium">Passwords match</span>
                  </div>
                ) : passwordsMismatch ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircleIcon className="h-4 w-4" />
                    <span className="font-medium">Passwords do not match</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full py-3 rounded-lg text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200" 
            disabled={loading || !passwordsMatch || !password}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting Password...
              </span>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>

        {/* Back to Login */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors"
            >
              Back to Login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
