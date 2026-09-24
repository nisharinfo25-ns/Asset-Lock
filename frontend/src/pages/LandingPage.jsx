import { Link } from 'react-router-dom'
import { Shield, Lock, Globe, ShieldCheck, ArrowRight, Zap, Database, Key } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-950 text-surface-100">
      {/* Nav */}
      <nav className="border-b border-surface-800 bg-surface-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-600 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-widest text-surface-100">ASSET-LOCK</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-surface-400 hover:text-surface-100 transition-colors">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-4 py-2 rounded-md font-medium">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-500/10 border border-accent-500/20 rounded-full text-xs text-accent-400 font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
            Blockchain-Verified Asset Security
          </div>
          <h1 className="text-5xl font-bold text-surface-50 leading-tight mb-6">
            Secure Your Digital Assets.<br />
            <span className="text-accent-400">Control Every Access.</span>
          </h1>
          <p className="text-lg text-surface-400 leading-relaxed mb-10 max-w-2xl">
            Asset-Lock combines decentralized identity, AES-256 encrypted storage, blockchain verification,
            and intelligent access control to protect sensitive digital assets.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/register" className="btn-primary px-6 py-3 text-base flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary px-6 py-3 text-base">
              Sign In
            </Link>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Lock, label: 'AES-256 Encryption', desc: 'Military-grade file encryption' },
            { icon: ShieldCheck, label: 'Blockchain Verified', desc: 'Immutable ownership records' },
            { icon: Globe, label: 'IPFS Storage', desc: 'Decentralized file storage' },
            { icon: Shield, label: 'Role-Based Access', desc: 'Granular permission control' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="card p-4">
              <Icon className="w-5 h-5 text-accent-400 mb-3" />
              <p className="text-sm font-medium text-surface-200 mb-1">{label}</p>
              <p className="text-xs text-surface-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section className="border-t border-surface-800 bg-surface-900/30">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-surface-100 mb-2">Security Workflow</h2>
          <p className="text-surface-500 mb-12">Every file goes through a verified security pipeline.</p>
          <div className="flex flex-col md:flex-row items-center gap-0">
            {[
              { label: 'Upload', icon: Database, desc: 'Select your file' },
              { label: 'Encrypt', icon: Lock, desc: 'AES-256 encryption' },
              { label: 'Hash', icon: Zap, desc: 'SHA-256 fingerprint' },
              { label: 'Store', icon: Globe, desc: 'Upload to IPFS' },
              { label: 'Verify', icon: ShieldCheck, desc: 'Blockchain record' },
              { label: 'Control', icon: Key, desc: 'Access management' },
            ].map(({ label, icon: Icon, desc }, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center text-center px-6 py-4">
                  <div className="w-10 h-10 rounded-full bg-accent-600/20 border border-accent-500/30 flex items-center justify-center mb-2">
                    <Icon className="w-4 h-4 text-accent-400" />
                  </div>
                  <p className="text-sm font-medium text-surface-200">{label}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{desc}</p>
                </div>
                {i < 5 && <ArrowRight className="w-4 h-4 text-surface-700 hidden md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800 py-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-accent-400" />
            <span className="text-sm font-bold tracking-widest text-surface-400">ASSET-LOCK</span>
          </div>
          <p className="text-xs text-surface-600">Blockchain-based Digital Asset Management</p>
        </div>
      </footer>
    </div>
  )
}
