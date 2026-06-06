import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from '@/components/ui/toast';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Eye,
  EyeOff,
  LockKeyhole,
} from 'lucide-react'
import { API_BASE_URL } from '@/lib/api/link'
import AuthShell from './AuthShell'

type Strength = 'weak' | 'medium' | 'strong'

export default function NewPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const getPasswordStrength = (value: string): Strength => {
    if (value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value)) return 'strong'
    if (value.length >= 6) return 'medium'
    return 'weak'
  }

  const passwordStrength = getPasswordStrength(password)
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword)
  const passwordsMismatch = Boolean(confirmPassword && password !== confirmPassword)

  const strengthCopy: Record<Strength, { label: string; icon: JSX.Element; fill: string }> = {
    weak: { label: 'Weak password', icon: <CircleX aria-hidden="true" />, fill: 'weak' },
    medium: { label: 'Medium strength', icon: <CircleAlert aria-hidden="true" />, fill: 'medium' },
    strong: { label: 'Strong password', icon: <CheckCircle2 aria-hidden="true" />, fill: 'strong' },
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const email = params.get('email')

    if (!token || !email) {
      toast.error('Invalid or missing token/email')
      setLoading(false)
      return
    }

    if (!passwordsMatch) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      await axios.post(`${API_BASE_URL}/auth/set-password`, {
        token,
        email,
        newPassword: password,
      })

      toast.success('Password set successfully!')
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to set password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      activeTab="login"
      hideTabs
      centerContent
      title={success ? <>Password <span className="accent">Set.</span></> : <>Set New <span className="accent">Password.</span></>}
      subtitle={success ? 'Your password has been saved. Redirecting to sign in...' : 'Create a strong password to activate secure access to Pickup Zone.'}
    >
      {success ? (
        <div className="pz-success">
          <div className="pz-success-circle"><Check aria-hidden="true" /></div>
          <div className="pz-success-title">Password set</div>
          <div className="pz-success-sub">You can now sign in with your new password.</div>
          <Link to="/login" className="pz-submit pz-secondary" style={{ marginTop: 24 }}>
            <ArrowLeft aria-hidden="true" size={16} /> Back to Login
          </Link>
        </div>
      ) : (
        <form className="pz-auth-form" onSubmit={handleSubmit}>
          {!token && (
            <div className="pz-alert">This password setup link is missing a token.</div>
          )}

          <label className="pz-field">
            <span className="pz-label">New Password</span>
            <span className="pz-field-wrap">
              <span className="pz-field-icon"><LockKeyhole aria-hidden="true" /></span>
              <input
                className="pz-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your new password"
                autoComplete="new-password"
                required
              />
              <button className="pz-pass-toggle" type="button" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </span>
          </label>

          {password && (
            <div className="pz-meter">
              <div className="pz-meter-row">
                {strengthCopy[passwordStrength].icon}
                {strengthCopy[passwordStrength].label}
              </div>
              <div className="pz-meter-track">
                <div className={`pz-meter-fill ${strengthCopy[passwordStrength].fill}`} />
              </div>
            </div>
          )}

          <label className="pz-field">
            <span className="pz-label">Confirm Password</span>
            <span className="pz-field-wrap">
              <span className="pz-field-icon"><LockKeyhole aria-hidden="true" /></span>
              <input
                className="pz-input"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                required
              />
              <button className="pz-pass-toggle" type="button" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                {showConfirmPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </span>
          </label>

          {passwordsMatch && (
            <div className="pz-validation-line success"><CheckCircle2 aria-hidden="true" /> Passwords match</div>
          )}
          {passwordsMismatch && (
            <div className="pz-validation-line error"><CircleX aria-hidden="true" /> Passwords do not match</div>
          )}

          <div className="pz-note">Use at least 8 characters with uppercase, lowercase, and numbers.</div>

          <button className="pz-submit" type="submit" disabled={loading || !passwordsMatch || !password}>
            {loading ? <><span className="pz-spinner" /> Setting...</> : <>Set Password <ArrowRight aria-hidden="true" size={16} /></>}
          </button>

          <div className="pz-switch">
            Remember your password? <Link to="/login">Back to Login</Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}
