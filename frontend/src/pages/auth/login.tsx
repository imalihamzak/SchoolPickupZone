import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { API_BASE_URL,LAN_API_BASE } from '@/lib/api/link'
import clsx from 'clsx'
import { 
  EyeIcon, 
  EyeSlashIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  UserIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline'
import { 
  UserCircleIcon as UserCircleSolid,
  ShieldCheckIcon as ShieldCheckSolid,
  UserGroupIcon as UserGroupSolid,
  IdentificationIcon as IdentificationSolid
} from '@heroicons/react/24/solid'


type Role = 'parent' | 'admin' | 'super-admin' | 'guard'

const roleConfig = {
  'parent': { icon: UserCircleSolid, label: 'Parent', color: 'blue' },
  'admin': { icon: ShieldCheckSolid, label: 'Admin', color: 'green' },
  'super-admin': { icon: ShieldCheckSolid, label: 'Super Admin', color: 'purple' },
  'guard': { icon: IdentificationSolid, label: 'Guard', color: 'orange' }
}

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('parent')
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await axios.post(`${LAN_API_BASE}/auth/login`, form)
      const { token, user } = res.data

      if (user.role !== role) {
        toast.error(`This account is not a ${role}.`)
        setLoading(false)
        return
      }

      localStorage.setItem('token', token)
      localStorage.setItem('role', user.role)

      toast.success('Login successful!')
      if (user.role === 'parent') navigate('/parent')
      else if (user.role === 'guard') navigate('/guard')
      else if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'super-admin') navigate('/super-admin')
      
      
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 sm:p-10 border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <img className="mx-auto h-16 w-auto mb-4" src="/logo.png" alt="School Pickup" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-sm text-gray-500">Sign in to your account to continue</p>
        </div>
  
        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <UserGroupIcon className="h-4 w-4 text-gray-500" />
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(['parent', 'admin', 'super-admin', 'guard'] as Role[]).map((r) => {
              const config = roleConfig[r]
              const Icon = config.icon
              const isSelected = role === r
              
              // Color classes mapping
              const colorClasses = {
                'parent': {
                  border: isSelected ? 'border-blue-500' : 'border-gray-200',
                  bg: isSelected ? 'bg-blue-50' : 'bg-white',
                  icon: isSelected ? 'text-blue-600' : 'text-gray-400',
                  text: isSelected ? 'text-blue-700' : 'text-gray-600',
                  dot: 'bg-blue-500'
                },
                'admin': {
                  border: isSelected ? 'border-green-500' : 'border-gray-200',
                  bg: isSelected ? 'bg-green-50' : 'bg-white',
                  icon: isSelected ? 'text-green-600' : 'text-gray-400',
                  text: isSelected ? 'text-green-700' : 'text-gray-600',
                  dot: 'bg-green-500'
                },
                'super-admin': {
                  border: isSelected ? 'border-purple-500' : 'border-gray-200',
                  bg: isSelected ? 'bg-purple-50' : 'bg-white',
                  icon: isSelected ? 'text-purple-600' : 'text-gray-400',
                  text: isSelected ? 'text-purple-700' : 'text-gray-600',
                  dot: 'bg-purple-500'
                },
                'guard': {
                  border: isSelected ? 'border-orange-500' : 'border-gray-200',
                  bg: isSelected ? 'bg-orange-50' : 'bg-white',
                  icon: isSelected ? 'text-orange-600' : 'text-gray-400',
                  text: isSelected ? 'text-orange-700' : 'text-gray-600',
                  dot: 'bg-orange-500'
                }
              }
              
              const colors = colorClasses[r]
              
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={clsx(
                    'relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200',
                    colors.border,
                    colors.bg,
                    isSelected ? 'shadow-md' : 'hover:border-gray-300 hover:shadow-sm'
                  )}
                >
                  <Icon className={clsx('h-6 w-6 mb-2', colors.icon)} />
                  <span className={clsx('text-xs font-medium capitalize', colors.text)}>
                    {config.label}
                  </span>
                  {isSelected && (
                    <div className={clsx('absolute top-2 right-2 w-2 h-2 rounded-full', colors.dot)} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
  
        {/* Login Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email Field */}
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
                required
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              />
            </div>
          </div>
  
          {/* Password Field */}
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
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
  
          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer group">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="group-hover:text-gray-900 transition-colors">Remember me</span>
            </label>
  
            <Link 
              to="/forgot-password" 
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
  
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full py-3 rounded-lg text-base font-semibold shadow-md hover:shadow-lg transition-all duration-200" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
  
        {/* Register Link */}
        {(role === 'parent' || role === 'guard') && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link 
                to={`/signup?role=${role}`} 
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                Register Now
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
