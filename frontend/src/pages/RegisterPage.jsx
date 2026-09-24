import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

function PasswordStrength({ password }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)]
  const strength = checks.filter(Boolean).length
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-danger', 'bg-warning', 'bg-info', 'bg-success']
  if (!password) return null
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : 'bg-surface-700'}`} />
        ))}
      </div>
      <p className="text-xs text-surface-500">Strength: <span className="text-surface-300">{labels[strength]}</span></p>
    </div>
  )
}

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { register } = useAuth()
  const navigate = useNavigate()

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email) e.email = 'Email is required'
    if (!form.password || form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    setErrors({})
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created successfully!')
      navigate('/app/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed'
      toast.error(msg)
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-widest">ASSET-LOCK</span>
        </div>
        <h1 className="text-2xl font-bold text-surface-100 mb-2">Create Account</h1>
        <p className="text-surface-400 text-sm mb-8">Secure your digital assets on the blockchain</p>

        {errors.general && (
          <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/20 rounded-md">
            <p className="text-sm text-danger">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" placeholder="Jane Smith" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} error={errors.name} />
          <Input label="Email" type="email" placeholder="you@company.com" value={form.email}
            onChange={e => setForm(p => ({ ...p, email: e.target.value }))} error={errors.email} />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
                className="input-field pr-10" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
            {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
          </div>
          <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirmPassword}
            onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} error={errors.confirmPassword} />
          <Button type="submit" variant="primary" className="w-full justify-center mt-2" loading={loading}>
            Create Secure Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-400">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-400 hover:text-accent-300">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
