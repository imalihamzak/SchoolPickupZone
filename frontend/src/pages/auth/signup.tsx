import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from '@/components/ui/toast';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Car,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  UsersRound,
  UserRound,
} from 'lucide-react'
import { LAN_API_BASE } from '@/lib/api/link'
import { useContactAvailability } from '@/lib/hooks/useContactAvailability'
import AuthShell from './AuthShell'

type SignupRole = 'parent'

type PublicSchool = {
  id: number
  name: string
  location?: string | null
}

const roleOptions: Array<{
  role: SignupRole
  icon: ReactNode
  label: string
  description: string
  hint: string
  iconStyle: CSSProperties
}> = [
  {
    role: 'parent',
    icon: <UsersRound aria-hidden="true" />,
    label: 'Parent',
    description: 'Register for my school',
    hint: 'Create your family account and connect it to the correct school before adding pickup details.',
    iconStyle: { background: 'rgba(26,158,117,0.15)' },
  },
]

const roleNames: Record<SignupRole, string> = {
  parent: 'Parent',
}

const roleTags: Record<SignupRole, { icon: ReactNode; label: string }> = {
  parent: { icon: <UsersRound aria-hidden="true" />, label: 'Parent Portal' },
}

const relationOptions = [
  { value: '', label: 'Select Relation' },
  { value: 'Mother', label: 'Mother' },
  { value: 'Father', label: 'Father' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Step Parent', label: 'Step Parent' },
  { value: 'Guardian', label: 'Guardian' },
  { value: 'Other', label: 'Other' },
]

const vehicleFields = [
  { key: 'name', label: 'Vehicle Name', placeholder: 'e.g. Toyota Highlander' },
  { key: 'make', label: 'Make', placeholder: 'e.g. Toyota' },
  { key: 'model', label: 'Model', placeholder: 'e.g. Highlander' },
  { key: 'color', label: 'Color', placeholder: 'e.g. White' },
  { key: 'plate_number', label: 'Plate Number', placeholder: 'e.g. ABC-123' },
  { key: 'year', label: 'Year', placeholder: 'e.g. 2024' },
] as const

function getRoleFromParam(value: string | null): SignupRole {
  return value === 'parent' ? value : 'parent'
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  const firstName = parts.shift() || ''
  const lastName = parts.join(' ') || firstName
  return { firstName, lastName }
}

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  if (score >= 4) return 'strong'
  if (score >= 2) return 'good'
  if (score >= 1) return 'weak'
  return 'empty'
}

function schoolLabel(school: PublicSchool) {
  return `${school.name}${school.location ? ` - ${school.location}` : ''}`
}

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryRole = useMemo(() => getRoleFromParam(searchParams.get('role')), [searchParams])
  const [step, setStep] = useState(1)
  const [role, setRole] = useState<SignupRole>(queryRole)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [schools, setSchools] = useState<PublicSchool[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(false)
  const [schoolSearch, setSchoolSearch] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    schoolId: '',
    relation: '',
    vehicle: {
      name: '',
      make: '',
      model: '',
      color: '',
      plate_number: '',
      year: '',
    },
  })
  const emailAvailability = useContactAvailability('email', form.email)
  const phoneAvailability = useContactAvailability('phone', form.phone)
  const hasAvailabilityBlock =
    emailAvailability.checking ||
    phoneAvailability.checking ||
    emailAvailability.available === false ||
    phoneAvailability.available === false

  useEffect(() => {
    setRole(queryRole)
  }, [queryRole])

  const selectedRole = roleOptions.find((item) => item.role === role) || roleOptions[0]
  const passwordStrength = getPasswordStrength(form.password)
  const schoolQuery = schoolSearch.trim().toLowerCase()
  const canSearchSchools = schoolQuery.length >= 2
  const filteredSchools = useMemo(() => {
    if (!canSearchSchools) return []
    return schools.filter((school) =>
      `${school.name} ${school.location || ''}`.toLowerCase().includes(schoolQuery)
    ).slice(0, 8)
  }, [canSearchSchools, schoolQuery, schools])
  const selectedSchool = useMemo(
    () => schools.find((school) => String(school.id) === String(form.schoolId)) || null,
    [form.schoolId, schools]
  )
  const selectedSchoolLabel = selectedSchool ? schoolLabel(selectedSchool) : ''
  const showSchoolResults = canSearchSchools && schoolSearch.trim() !== selectedSchoolLabel

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setSchoolsLoading(true)
        const { data } = await axios.get(`${LAN_API_BASE}/auth/schools`)
        setSchools(Array.isArray(data) ? data : [])
      } catch {
        setSchools([])
        toast.error('Unable to load schools right now.')
      } finally {
        setSchoolsLoading(false)
      }
    }

    fetchSchools()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSchoolSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSchoolSearch(value)
    setError('')

    if (selectedSchool && value.trim() !== selectedSchoolLabel) {
      setForm((current) => ({ ...current, schoolId: '' }))
    }
  }

  const handleSchoolSelect = (school: PublicSchool) => {
    setForm((current) => ({ ...current, schoolId: String(school.id) }))
    setSchoolSearch(schoolLabel(school))
    setError('')
  }

  const handleVehicleChange = (key: keyof typeof form.vehicle, value: string) => {
    setForm((current) => ({
      ...current,
      vehicle: {
        ...current.vehicle,
        [key]: value,
      },
    }))
    setError('')
  }

  const updateRole = (nextRole: SignupRole) => {
    setRole(nextRole)
    setError('')
  }

  const validateStepTwo = () => {
    if (!form.fullName.trim()) {
      setError('Full name is required.')
      return false
    }
    if (!form.email.includes('@')) {
      setError('Please enter a valid email address.')
      return false
    }
    if (!form.phone.trim()) {
      setError('Phone number is required.')
      return false
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return false
    }
    if (hasAvailabilityBlock) {
      setError('Please use an available email address and mobile number.')
      return false
    }
    return true
  }

  const validateStepThree = () => {
    if (!form.schoolId) {
      setError('Please select the school your child attends.')
      return false
    }
    if (!form.relation.trim()) {
      setError('Please select your relation to the child.')
      return false
    }
    if (vehicleFields.some((field) => !form.vehicle[field.key].trim())) {
      setError('Please complete all required vehicle details.')
      return false
    }
    return true
  }

  const goStep = (nextStep: number) => {
    setError('')
    if (nextStep === 3 && !validateStepTwo()) return
    setStep(nextStep)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!validateStepTwo()) {
      setStep(2)
      return
    }

    if (!validateStepThree()) {
      setStep(3)
      return
    }

    setLoading(true)
    try {
      const { firstName, lastName } = splitName(form.fullName)
      const payload = {
        firstName,
        lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role,
        school_id: Number(form.schoolId),
        relation: form.relation,
        vehicle: form.vehicle,
      }

      await axios.post(`${LAN_API_BASE}/auth/register`, payload)

      toast.success('Registered successfully! Please login.')
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1500)
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Registration failed.'
      toast.error(message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      activeTab="signup"
      title={<>Parent <span className="accent">Signup.</span></>}
      subtitle="Create a parent account and connect it to the correct school."
    >
      {success ? (
        <div className="pz-success">
          <div className="pz-success-circle"><Check aria-hidden="true" /></div>
          <div className="pz-success-title">Account created!</div>
          <div className="pz-success-sub">Your {roleNames[role]} account has been created. Redirecting to sign in...</div>
          <div className="pz-role-tag">{roleTags[role].icon} {roleTags[role].label}</div>
        </div>
      ) : (
        <form className="pz-auth-form" onSubmit={handleSubmit}>
          <div className="pz-step-indicator">
            {[1, 2, 3].map((item) => (
              <div style={{ display: 'contents' }} key={item}>
                <div className={`pz-step-dot ${item < step ? 'done' : item === step ? 'active' : 'idle'}`}>
                  {item < step ? <Check aria-hidden="true" size={14} /> : item}
                </div>
                {item < 3 && <div className={`pz-step-line ${item < step ? 'done' : ''}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <>
              <div className="pz-role-section">
                <div className="pz-role-label">I am a...</div>
                <div className="pz-role-grid">
                  {roleOptions.map((item) => (
                    <button
                      type="button"
                      className={`pz-role-option ${role === item.role ? 'selected' : ''}`}
                      onClick={() => updateRole(item.role)}
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

              <div className="pz-hint">{selectedRole.hint}</div>
              <button className="pz-submit" type="button" onClick={() => goStep(2)}>
                Continue <ArrowRight aria-hidden="true" size={16} />
              </button>
              <div className="pz-switch">Already have an account? <Link to="/login">Sign in</Link></div>
            </>
          )}

          {step === 2 && (
            <>
              <label className="pz-field">
                <span className="pz-label">Full Name</span>
                <span className="pz-field-wrap">
                  <span className="pz-field-icon"><UserRound aria-hidden="true" /></span>
                  <input
                    className="pz-input"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                  />
                </span>
              </label>

              <label className="pz-field">
                <span className="pz-label">Email Address</span>
                <span className="pz-field-wrap">
                  <span className="pz-field-icon"><Mail aria-hidden="true" /></span>
                  <input
                    className="pz-input"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@email.com"
                    autoComplete="email"
                    required
                  />
                </span>
                {emailAvailability.message && (
                  <span className={`pz-validation-line ${emailAvailability.available === false ? 'error' : 'success'}`}>
                    {emailAvailability.message}
                  </span>
                )}
              </label>

              <label className="pz-field">
                <span className="pz-label">Phone Number</span>
                <span className="pz-field-wrap">
                  <span className="pz-field-icon"><Phone aria-hidden="true" /></span>
                  <input
                    className="pz-input"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 000-0000"
                    autoComplete="tel"
                    required
                  />
                </span>
                {phoneAvailability.message && (
                  <span className={`pz-validation-line ${phoneAvailability.available === false ? 'error' : 'success'}`}>
                    {phoneAvailability.message}
                  </span>
                )}
              </label>

              <label className="pz-field">
                <span className="pz-label">Password</span>
                <span className="pz-field-wrap">
                  <span className="pz-field-icon"><LockKeyhole aria-hidden="true" /></span>
                  <input
                    className="pz-input"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    required
                  />
                  <button className="pz-pass-toggle" type="button" onClick={() => setShowPassword((prev) => !prev)}>
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </span>
              </label>

              <div className="pz-note">
                Password strength: {passwordStrength === 'empty' ? 'Enter a password' : passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'good' ? 'Good' : 'Strong'}
              </div>

              {error && <div className="pz-alert">{error}</div>}

              <div className="pz-inline-row">
                <button className="pz-submit pz-secondary" type="button" onClick={() => goStep(1)}>
                  <ArrowLeft aria-hidden="true" size={16} /> Back
                </button>
                <button className="pz-submit" type="button" onClick={() => goStep(3)} disabled={hasAvailabilityBlock}>
                  Continue <ArrowRight aria-hidden="true" size={16} />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="pz-role-section">
                <div className="pz-role-label">Role details</div>
                <div className="pz-role-option selected" style={{ cursor: 'default' }}>
                  <div className="pz-role-icon" style={selectedRole.iconStyle}>{selectedRole.icon}</div>
                  <div className="pz-role-copy">
                    <div className="pz-role-name">{selectedRole.label}</div>
                    <div className="pz-role-desc">{selectedRole.description}</div>
                  </div>
                  <div className="pz-role-check"><Check aria-hidden="true" /></div>
                </div>
              </div>

              <label className="pz-field">
                <span className="pz-label">Find Your School</span>
                <span className="pz-field-wrap">
                  <span className="pz-field-icon"><MapPin aria-hidden="true" /></span>
                  <input
                    className="pz-input"
                    value={schoolSearch}
                    onChange={handleSchoolSearchChange}
                    placeholder="Search by school name or city"
                    autoComplete="off"
                  />
                </span>
              </label>

              <div className="pz-field">
                <span className="pz-label">School Results</span>
                {schoolsLoading ? (
                  <div className="pz-note">Loading schools...</div>
                ) : selectedSchool ? (
                  <button
                    type="button"
                    className="pz-role-option pz-school-result selected"
                    style={{ cursor: 'default' }}
                    aria-label={`Selected school: ${selectedSchoolLabel}`}
                  >
                    <div className="pz-role-icon" style={{ background: 'rgba(27,110,204,0.15)' }}>
                      <Building2 aria-hidden="true" />
                    </div>
                    <div className="pz-role-copy">
                      <div className="pz-role-name">{selectedSchool.name}</div>
                      <div className="pz-role-desc">{selectedSchool.location || 'Selected school'}</div>
                    </div>
                    <div className="pz-role-check"><Check aria-hidden="true" /></div>
                  </button>
                ) : !canSearchSchools ? (
                  <div className="pz-note">Type at least 2 letters to find your school.</div>
                ) : showSchoolResults && filteredSchools.length ? (
                  <div className="pz-school-result-list">
                    {filteredSchools.map((school) => (
                      <button
                        type="button"
                        className="pz-role-option pz-school-result"
                        onClick={() => handleSchoolSelect(school)}
                        key={school.id}
                      >
                        <div className="pz-role-icon" style={{ background: 'rgba(27,110,204,0.15)' }}>
                          <Building2 aria-hidden="true" />
                        </div>
                        <div className="pz-role-copy">
                          <div className="pz-role-name">{school.name}</div>
                          <div className="pz-role-desc">{school.location || 'School'}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="pz-note">No matching schools found. Try a shorter school name or city.</div>
                )}
                <div className="pz-note">
                  {selectedSchool
                    ? `Your family account will be connected to ${selectedSchool.name}.`
                    : 'Only matching schools appear here; the full school list is not shown.'}
                </div>
              </div>

              <div className="pz-auth-section">
                <div className="pz-auth-section-title">
                  <UserRound aria-hidden="true" size={15} />
                  Parent Pickup Details
                </div>
                <label className="pz-field">
                  <span className="pz-label">Relation to Child</span>
                  <span className="pz-field-wrap">
                    <span className="pz-field-icon"><UsersRound aria-hidden="true" /></span>
                    <select
                      className="pz-input pz-select"
                      name="relation"
                      value={form.relation}
                      onChange={handleChange}
                      required
                    >
                      {relationOptions.map((option) => (
                        <option value={option.value} key={option.value || option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>
              </div>

              <div className="pz-auth-section">
                <div className="pz-auth-section-title">
                  <Car aria-hidden="true" size={15} />
                  Vehicle Information
                </div>
                <div className="pz-auth-form-grid">
                  {vehicleFields.map((field) => (
                    <label className="pz-field" key={field.key}>
                      <span className="pz-label">{field.label}</span>
                      <span className="pz-field-wrap">
                        <span className="pz-field-icon"><Car aria-hidden="true" /></span>
                        <input
                          className="pz-input"
                          type={field.key === 'year' ? 'number' : 'text'}
                          value={form.vehicle[field.key]}
                          onChange={(event) => handleVehicleChange(field.key, event.target.value)}
                          placeholder={field.placeholder}
                          required
                        />
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {error && <div className="pz-alert">{error}</div>}

              <div className="pz-inline-row">
                <button className="pz-submit pz-secondary" type="button" onClick={() => goStep(2)}>
                  <ArrowLeft aria-hidden="true" size={16} /> Back
                </button>
                <button className="pz-submit" type="submit" disabled={loading || schoolsLoading || hasAvailabilityBlock}>
                  {loading ? <><span className="pz-spinner" /> Creating...</> : <>Create Account <ArrowRight aria-hidden="true" size={16} /></>}
                </button>
              </div>

              <div className="pz-switch" style={{ marginTop: 16 }}>
                By signing up, you agree to our Terms and Privacy Policy
              </div>
            </>
          )}
        </form>
      )}
    </AuthShell>
  )
}
