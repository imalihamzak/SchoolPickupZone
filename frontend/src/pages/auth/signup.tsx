import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { toast } from 'react-toastify'
import { API_BASE_URL, LAN_API_BASE } from '@/lib/api/link'
import clsx from 'clsx'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const role = searchParams.get('role') === 'guard' ? 'guard' : 'parent'
  const totalSteps = role === 'parent' ? 3 : 2

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    childName: ''
  })

  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        role,
        ...(role !== 'parent' && { childName: undefined }) // remove childName if not parent
      }

      await axios.post(`${LAN_API_BASE}/auth/register`, payload)
      toast.success('Registered successfully! Please login.')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Registration failed.')
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password)) return 'strong'
    if (password.length >= 6) return 'medium'
    return 'weak'
  }
  const passwordStrength = getPasswordStrength(form.password)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 sm:p-10 transition-all duration-300 ease-in-out border border-gray-100">
        {/* Header */}
        <div className="text-center mb-6">
          <img className="mx-auto h-16 w-auto mb-4" src="/logo.png" alt="School Pickup" />
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">Create Your Account</h2>
          <p className="text-sm text-gray-500">
            For <span className="capitalize font-semibold text-indigo-600">{role}</span> only
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[...Array(totalSteps)].map((_, i) => (
              <div key={i} className="flex-1 flex items-center">
                <div className="flex-1 flex items-center">
                  <div className={clsx(
                    'flex-1 h-2 rounded-full transition-all duration-300',
                    i + 1 <= step ? 'bg-indigo-600' : 'bg-gray-200'
                  )}></div>
                </div>
                {i < totalSteps - 1 && (
                  <div className={clsx(
                    'w-2 h-2 rounded-full mx-2 transition-all duration-300',
                    i + 1 < step ? 'bg-indigo-600' : 'bg-gray-200'
                  )}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span className={clsx('font-medium', step >= 1 && 'text-indigo-600')}>Personal Info</span>
            <span className={clsx('font-medium', step >= 2 && 'text-indigo-600')}>Credentials</span>
            {role === 'parent' && <span className={clsx('font-medium', step >= 3 && 'text-indigo-600')}>Child Info</span>}
          </div>
        </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={form.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Credentials */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
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
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john.doe@example.com"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
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
              <p className="mt-2 text-xs text-gray-500">
                Use at least 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Child Info (Parent only) */}
        {step === 3 && role === 'parent' && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-3">
                <UserCircleIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Child Information</h3>
              <p className="text-sm text-gray-500 mt-1">Enter your child's details</p>
            </div>
            <div>
              <label htmlFor="childName" className="block text-sm font-semibold text-gray-700 mb-2">
                Child's Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserCircleIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="childName"
                  name="childName"
                  type="text"
                  value={form.childName}
                  onChange={handleChange}
                  placeholder="Enter child's full name"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 1 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep(prev => prev - 1)}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Button>
          )}
          {step < totalSteps ? (
            <Button 
              type="button" 
              onClick={() => setStep(prev => prev + 1)}
              className={step === 1 ? 'ml-auto flex items-center gap-2' : 'flex items-center gap-2'}
            >
              Next
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              className="w-full py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              Create Account
            </Button>
          )}
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  </div>
  )
}
