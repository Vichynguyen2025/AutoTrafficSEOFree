import { useEffect, useState } from 'react'
import { Plus, Play, Square, Trash2, Copy, ExternalLink, Loader2 } from 'lucide-react'

interface Profile {
  id: string
  name: string
  userDataDir: string | null
  proxyId: string | null
  proxy: any | null
  note: string | null
  status: string
  createdAt: string
}

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', note: '' })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [browsers, setBrowsers] = useState<Record<string, boolean>>({})

  async function load() {
    try {
      const data = await window.electronAPI.getProfiles()
      setProfiles(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.name.trim()) return
    try {
      await window.electronAPI.createProfile({ name: form.name, note: form.note })
      setForm({ name: '', note: '' })
      setShowForm(false)
      await load()
    } catch (e: any) { alert(e.message) }
  }

  async function remove(id: string) {
    if (!confirm('Delete this profile?')) return
    await window.electronAPI.deleteProfile(id)
    await load()
  }

  async function clone(ids: string[]) {
    await window.electronAPI.cloneProfiles(ids)
    await load()
  }

  async function openBrowser(profileId: string) {
    try {
      setBrowsers((p) => ({ ...p, [profileId]: true }))
      await window.electronAPI.openBrowser(profileId)
    } catch (e: any) { alert(e.message) }
    setTimeout(async () => {
      const s = await window.electronAPI.getBrowserStatus(profileId)
      setBrowsers((p) => ({ ...p, [profileId]: s.running }))
    }, 1000)
  }

  async function closeBrowser(profileId: string) {
    await window.electronAPI.closeBrowser(profileId)
    setBrowsers((p) => ({ ...p, [profileId]: false }))
  }

  function toggle(id: string) {
    setSelected((p) => {
      const n = new Set(p)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold mb-1">Profiles</h1>
          <p className="text-[13px] text-gray-500">{profiles.length} browser profiles</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 1 && (
            <button onClick={() => clone([...selected])} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50">
              <Copy className="w-4 h-4" /> Clone ({selected.size})
            </button>
          )}
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[12px] font-bold hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> New Profile
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4 bg-white rounded-2xl border border-gray-200 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Profile name" className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Note (optional)" className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
            <div className="flex gap-2">
              <button onClick={create} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[12px] font-bold hover:bg-indigo-700">Create</button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {profiles.map((p) => {
            const isRunning = browsers[p.id] || p.status === 'running'
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 grid place-items-center text-indigo-600 font-bold text-[13px]">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13.5px] truncate flex items-center gap-2">
                    {p.name}
                    {isRunning && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </div>
                  <div className="text-[11.5px] text-gray-400 truncate">
                    {p.proxy ? `${p.proxy.host}:${p.proxy.port}` : 'No proxy'} · {p.note || 'No note'}
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {isRunning ? (
                    <button onClick={() => closeBrowser(p.id)} title="Close Browser"
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors">
                      <Square className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={() => openBrowser(p.id)} title="Open Browser"
                      className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => clone([p.id])} title="Clone"
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(p.id)} title="Delete"
                    className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
          {profiles.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-[13px]">
              No profiles yet. Click "New Profile" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}