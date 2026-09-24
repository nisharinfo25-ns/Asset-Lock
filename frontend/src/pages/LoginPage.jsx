import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    if (!form.email) return setErrors({ email: 'Username or email is required' })
    if (!form.password) return setErrors({ password: 'Password is required' })

    setLoading(true)
    try {
      const loggedUser = await login(form.email, form.password)
      toast.success('Welcome back!')
      if (loggedUser?.role?.toUpperCase() === 'ADMIN') {
        navigate('/app/admin')
      } else {
        navigate('/app/dashboard')
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed'
      toast.error(msg)
      setErrors({ general: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-surface-900 border-r border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
            <Lock className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-widest text-surface-100">ASSET-LOCK</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-surface-100 leading-tight mb-4">
            Secure Digital Asset Management
          </h2>
          <p className="text-surface-400 mb-8">
            Blockchain-verified access control with AES-256 encryption and IPFS storage.
          </p>
          <div className="space-y-3">
            {['AES-256 file encryption', 'Blockchain ownership verification', 'IPFS decentralized storage', 'Smart contract access control'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                <span className="text-sm text-surface-300">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-surface-600">Enterprise-grade security for your digital assets</p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-100 mb-2">Sign In</h1>
            <p className="text-surface-400 text-sm">Access your secure asset vault</p>
          </div>

          {errors.general && (
            <div className="mb-4 px-4 py-3 bg-danger/10 border border-danger/20 rounded-md">
              <p className="text-sm text-danger">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Username or Email" type="text" placeholder="Nexshield@Admin or user@company.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} error={errors.email} />
            <div className="space-y-1">
              <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  className="input-field pr-10" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
            </div>

            <Button type="submit" variant="primary" className="w-full justify-center" loading={loading}>
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-400">
            No account?{' '}
            <Link to="/register" className="text-accent-400 hover:text-accent-300">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
