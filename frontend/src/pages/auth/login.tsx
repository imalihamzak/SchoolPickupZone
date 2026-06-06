import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from '@/components/ui/toast';
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ScanSearch,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { LAN_API_BASE } from '@/lib/api/link'
import AuthShell from './AuthShell'

type Role = 'parent' | 'admin' | 'guard' | 'super-admin'

type LoginProps = {
  superAdminOnly?: boolean
}

const normalRoles: Array<{
  role: Role
  icon: ReactNode
  label: string
  description: string
  iconStyle: CSSProperties
}> = [
  {
    role: 'admin',
    icon: <Building2 aria-hidden="true" />,
    label: 'Admin',
    description: 'Manage pickups',
    iconStyle: { background: 'rgba(27,110,204,0.15)' },
  },
  {
    role: 'parent',
    icon: <UsersRound aria-hidden="true" />,
    label: 'Parent',
    description: 'View QR codes',
    iconStyle: { background: 'rgba(26,158,117,0.15)' },
  },
  {
    role: 'guard',
    icon: <ScanSearch aria-hidden="true" />,
    label: 'Guard',
    description: 'Scan and verify',
    iconStyle: { background: 'rgba(239,159,39,0.15)' },
  },
]

const roleDisplay: Record<Role, { icon: ReactNode; label: string; route: string }> = {
  admin: { icon: <Building2 aria-hidden="true" />, label: 'Admin Dashboard', route: '/admin' },
  parent: { icon: <UsersRound aria-hidden="true" />, label: 'Parent Portal', route: '/parent' },
  guard: { icon: <ScanSearch aria-hidden="true" />, label: 'Guard Scanner', route: '/guard' },
  'super-admin': { icon: <ShieldCheck aria-hidden="true" />, label: 'Super Admin Dashboard', route: '/super-admin' },
}

function normalizeRole(role: string): Role | string {
  return role === 'superadmin' ? 'super-admin' : role
}

export default function Login({ superAdminOnly = false }: LoginProps) {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>(superAdminOnly ? 'super-admin' : 'admin')
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successRole, setSuccessRole] = useState<Role | null>(null)

  useEffect(() => {
    setRole(superAdminOnly ? 'super-admin' : 'admin')
    setSuccessRole(null)
    setError('')
  }, [superAdminOnly])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await axios.post(`${LAN_API_BASE}/auth/login`, form)
      const { token, user } = res.data
      const userRole = normalizeRole(user.role) as Role

      if (userRole !== role) {
        const label = role === 'super-admin' ? 'Super Admin' : roleDisplay[role].label.replace(' Dashboard', '')
        const message = `This account is not a ${label}.`
        toast.error(message)
        setError(message)
        setLoading(false)
        return
      }

      localStorage.setItem('token', token)
      localStorage.setItem('role', user.role)

      setSuccessRole(userRole)
      toast.success('Login successful!')

      setTimeout(() => {
        navigate(roleDisplay[userRole].route)
      }, 650)
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Login failed.'
      toast.error(message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      activeTab="login"
      superAdmin={superAdminOnly}
      centerContent={superAdminOnly}
      title={superAdminOnly ? <>Super Admin <span className="accent">Sign In.</span></> : <>Welcome <span className="accent">Back.</span></>}
      subtitle={
        superAdminOnly
          ? 'Use the dedicated Super Admin route to access system-wide schools, billing, and subscriptions.'
          : 'Sign in with your school role to continue to the correct Pickup Zone dashboard.'
      }
    >
      {successRole ? (
        <div className="pz-success">
          <div className="pz-success-circle"><Check aria-hidden="true" /></div>
          <div className="pz-success-title">Welcome back!</div>
          <div className="pz-success-sub">Redirecting to your dashboard...</div>
          <div className="pz-role-tag">{roleDisplay[successRole].icon} {roleDisplay[successRole].label}</div>
        </div>
      ) : (
        <form className="pz-auth-form" onSubmit={handleSubmit}>
          {!superAdminOnly && (
            <div className="pz-role-section">
              <div className="pz-role-label">Sign in as</div>
              <div className="pz-role-grid">
                {normalRoles.map((item) => (
                  <button
                    type="button"
                    className={`pz-role-option ${role === item.role ? 'selected' : ''}`}
                    onClick={() => setRole(item.role)}
                    key={item.role}
                  >
                    <div className="pz-role-icon" style={item.iconStyle}>{item.icon}</div>
                    <div className="pz-role-copy">
                      <div className="pz-role-name">{item.label}</div>
                      <div className="pz-role-desc">{item.description}</div>
                    </div>
                    <div className="pz-role-check"><Check aria-hidden="true" /></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="pz-field">
            <span className="pz-label">Email Address</span>
            <span className="pz-field-wrap">
              <span className="pz-field-icon"><Mail aria-hidden="true" /></span>
              <input
                className="pz-input"
                name="email"
                type="email"
                placeholder={superAdminOnly ? 'superadmin@example.com' : 'you@school.edu'}
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </span>
          </label>

          <label className="pz-field">
            <span className="pz-label">Password</span>
            <span className="pz-field-wrap">
              <span className="pz-field-icon"><LockKeyhole aria-hidden="true" /></span>
              <input
                className="pz-input"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button className="pz-pass-toggle" type="button" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </span>
          </label>

          {error && <div className="pz-alert">{error}</div>}

          <div className="pz-forgot">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button className="pz-submit" type="submit" disabled={loading}>
            {loading ? <><span className="pz-spinner" /> Signing in...</> : <>Sign In <ArrowRight aria-hidden="true" size={16} /></>}
          </button>

          {superAdminOnly ? (
            <div className="pz-switch">
              Standard user? <Link to="/login">Go to normal login</Link>
            </div>
          ) : role === 'parent' ? (
            <div className="pz-switch">
              New parent? <Link to="/signup">Create a parent account</Link>
            </div>
          ) : (
            <div className="pz-switch">
              {role === 'admin'
                ? 'School admin accounts are created by the platform team.'
                : 'Guard accounts are created by the school admin.'}
            </div>
          )}
        </form>
      )}
    </AuthShell>
  )
}
