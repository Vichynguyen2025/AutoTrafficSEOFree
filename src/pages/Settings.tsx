import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, Save, Loader2, Eye, EyeOff } from 'lucide-react'

export default function Settings() {
  const [headless, setHeadless] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.electronAPI.getSettings().then((s: any) => {
      if (s && typeof s.headless === 'boolean') setHeadless(s.headless)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function save() {
    setSaving(true)
    setMsg('')
    try {
      await window.electronAPI.updateSettings({ headless })
      setMsg('✅ Saved')
      setTimeout(() => setMsg(''), 2000)
    } catch (e: any) { setMsg('❌ ' + e.message) }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold mb-1">Settings</h1>
        <p className="text-[13px] text-gray-500">Application configuration</p>
      </div>

      <div className="max-w-xl space-y-4">
        {/* Browser behavior */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-[14px] font-bold mb-4">Browser Behavior</div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <span className={`w-10 h-10 rounded-xl ${headless ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-600'} grid place-items-center transition-colors`}>
                {headless ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </span>
              <div>
                <div className="font-semibold text-[13px]">Headless Mode</div>
                <div className="text-[11.5px] text-gray-400">{headless ? 'Browser runs hidden (no visible window)' : 'Browser window is visible on desktop'}</div>
              </div>
            </div>
            <button
              onClick={() => setHeadless(!headless)}
              className={`relative w-12 h-6 rounded-full transition-colors ${headless ? 'bg-indigo-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${headless ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div className="text-[11px] text-gray-400 mt-2 bg-gray-50 rounded-xl p-3">
            <strong>Default:</strong> Visible (OFF). When running a scenario, you can override this per-run.
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="text-[14px] font-bold mb-4">Database Connection</div>
          <div className="text-[13px] text-gray-500 mb-2">
            Configure via <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600">.env</code> file:
          </div>
          <div className="bg-gray-50 rounded-xl p-3.5 text-[12px] font-mono text-gray-600 mb-3">
            DATABASE_URL="mysql://user:password@localhost:3306/autotraffic_seo"
          </div>
          <div className="text-[12px] text-gray-500">Prisma handles schema migrations automatically on startup.</div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[12px] font-bold hover:shadow-lg disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
          </button>
          {msg && <span className="text-[13px] font-semibold text-emerald-600">{msg}</span>}
        </div>
      </div>
    </div>
  )
}