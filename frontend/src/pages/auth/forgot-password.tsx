import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from '@/components/ui/toast';
import { ArrowLeft, ArrowRight, Check, Mail, SendHorizontal } from 'lucide-react'
import { API_BASE_URL } from '@/lib/api/link'
import AuthShell from './AuthShell'

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
    <AuthShell
      activeTab="login"
      hideTabs
      centerContent
      title={emailSent ? <>Check Your <span className="accent">Email.</span></> : <>Reset <span className="accent">Password.</span></>}
      subtitle={
        emailSent
          ? "We've sent password reset instructions to your email address."
          : "Enter the email address connected to your Pickup Zone account and we'll send a secure reset link."
      }
    >
      {emailSent ? (
        <div className="pz-success">
          <div className="pz-success-circle"><Check aria-hidden="true" /></div>
          <div className="pz-success-title">Reset link sent</div>
          <div className="pz-success-sub">Please check your inbox and follow the link to reset your password.</div>
          <Link to="/login" className="pz-submit pz-secondary" style={{ marginTop: 24 }}>
            <ArrowLeft aria-hidden="true" size={16} /> Back to Login
          </Link>
        </div>
      ) : (
        <form className="pz-auth-form" onSubmit={handleSubmit}>
          <label className="pz-field">
            <span className="pz-label">Email Address</span>
            <span className="pz-field-wrap">
              <span className="pz-field-icon"><Mail aria-hidden="true" /></span>
              <input
                className="pz-input"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                required
              />
            </span>
            <span className="pz-note">Enter the email address associated with your account.</span>
          </label>

          <button className="pz-submit" type="submit" disabled={loading}>
            {loading ? <><span className="pz-spinner" /> Sending...</> : <><SendHorizontal aria-hidden="true" size={16} /> Send Reset Link</>}
          </button>

          <div className="pz-switch">
            Remember your password? <Link to="/login">Back to Login <ArrowRight aria-hidden="true" size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /></Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}
