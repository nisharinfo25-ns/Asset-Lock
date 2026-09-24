import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react'
import { assetsAPI } from '../lib/api'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardBody } from '../components/ui/Card'
import toast from 'react-hot-toast'

const STEPS = ['Uploading', 'Encrypting', 'Hashing', 'Uploading to IPFS', 'Blockchain Register', 'Saving Metadata', 'Complete']

export default function UploadAsset() {
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [step, setStep] = useState(-1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()
  const navigate = useNavigate()

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')
    if (!name.trim()) return toast.error('Please enter an asset name')

    setLoading(true)
    setError('')
    setStep(0)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('name', name)
    fd.append('description', description)

    // Simulate step progression
    const stepInterval = setInterval(() => {
      setStep(prev => prev < 5 ? prev + 1 : prev)
    }, 1200)

    try {
      const res = await assetsAPI.upload(fd)
      clearInterval(stepInterval)
      setStep(6)
      setResult(res.data.data)
      toast.success('Asset secured successfully!')
    } catch (err) {
      clearInterval(stepInterval)
      setStep(-1)
      const msg = err.response?.data?.error || 'Upload failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-success/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <h2 className="text-base font-semibold text-surface-100">Asset Secured</h2>
            </div>
          </div>
          <CardBody className="space-y-4">
            <div className="space-y-3">
              {[
                { label: 'Asset ID', value: result.asset?.id, mono: true },
                { label: 'IPFS CID', value: result.ipfsCid, mono: true },
                { label: 'SHA-256 Hash', value: result.fileHash, mono: true },
                { label: 'Blockchain Tx', value: result.blockchain?.transactionHash || 'Not configured', mono: true },
              ].map(({ label, value, mono }) => (
                <div key={label} className="p-3 bg-surface-800 rounded-lg">
                  <p className="text-xs text-surface-500 mb-1">{label}</p>
                  <p className={`text-xs text-surface-200 break-all ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="primary" onClick={() => navigate(`/app/assets/${result.asset?.id}`)}>View Asset</Button>
              <Button variant="secondary" onClick={() => { setResult(null); setFile(null); setName(''); setDescription(''); setStep(-1) }}>Upload Another</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h2 className="text-base font-semibold text-surface-100">Upload Secure Asset</h2>
        <p className="text-sm text-surface-500">Files are AES-256 encrypted before IPFS storage</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current.click()}
          className="border-2 border-dashed border-surface-700 hover:border-accent-500/50 rounded-lg p-10 text-center cursor-pointer transition-colors"
        >
          <input ref={fileRef} type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <File className="w-10 h-10 text-accent-400" />
              <p className="text-sm font-medium text-surface-200">{file.name}</p>
              <p className="text-xs text-surface-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-surface-600" />
              <p className="text-sm text-surface-400">Drop your secure asset here</p>
              <p className="text-xs text-surface-600">or click to browse — max 50MB</p>
            </div>
          )}
        </div>

        <Input label="Asset Name" placeholder="Confidential Report Q4" value={name} onChange={e => setName(e.target.value)} />
        <div className="space-y-1">
          <label className="block text-xs font-medium text-surface-400 uppercase tracking-wider">Description</label>
          <textarea className="input-field h-20 resize-none" placeholder="Optional description..."
            value={description} onChange={e => setDescription(e.target.value)} />
        </div>

        {/* Progress Steps */}
        {step >= 0 && (
          <div className="p-4 bg-surface-800 rounded-lg space-y-2">
            {STEPS.map((s, i) => (
              <div key={s} className={`flex items-center gap-3 text-sm ${
                i < step ? 'text-success' : i === step ? 'text-accent-400' : 'text-surface-600'
              }`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  i < step ? 'border-success bg-success' : i === step ? 'border-accent-400' : 'border-surface-700'
                }`}>
                  {i < step && <CheckCircle className="w-3 h-3 text-white" />}
                  {i === step && <div className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />}
                </div>
                {s}
              </div>
            ))}
          </div>
        )}

        <Button type="submit" variant="primary" className="w-full justify-center" loading={loading} disabled={!file || !name}>
          <Upload className="w-4 h-4" /> Encrypt & Secure Asset
        </Button>
      </form>
    </div>
  )
}
