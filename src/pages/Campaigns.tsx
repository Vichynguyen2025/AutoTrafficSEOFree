import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Play, Square, Pause, Loader2, Calendar, Activity } from 'lucide-react'

interface Campaign {
  id: string
  name: string
  status: string
  concurrency: number
  variables: string
  scenario: { id: string; name: string }
  _count: { tasks: number }
  createdAt: string
  isRunning?: boolean
  isPaused?: boolean
  activeCount?: number
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', scenarioId: '', profileIds: [] as string[], concurrency: 2, headless: true })
  const [scenarios, setScenarios] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [variables, setVariables] = useState<Record<string, string>>({ keyword: '', targetDomain: '', url: '', text: '' })
  const navigate = useNavigate()

  async function load() {
    try {
      const [c, s, p] = await Promise.all([
        window.electronAPI.getCampaigns(),
        window.electronAPI.getScenarios(),
        window.electronAPI.getProfiles(),
      ])
      setCampaigns(c)
      setScenarios(s)
      setProfiles(p)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.name.trim() || !form.scenarioId || form.profileIds.length === 0) return
    await window.electronAPI.createCampaign({
      name: form.name,
      scenarioId: form.scenarioId,
      profileIds: form.profileIds,
      variables,
      concurrency: form.concurrency,
      headless: form.headless,
    })
    setShowForm(false)
    setForm({ name: '', scenarioId: '', profileIds: [], concurrency: 2, headless: true })
    await load()
  }

  async function startCamp(id: string) {
    await window.electronAPI.startCampaign(id)
    await load()
  }

  async function stopCamp(id: string) {
    await window.electronAPI.stopCampaign(id)
    await load()
  }

  async function pauseCamp(id: string) {
    await window.electronAPI.pauseCampaign(id)
    await load()
  }

  async function resumeCamp(id: string) {
    await window.electronAPI.resumeCampaign(id)
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this campaign?')) return
    await window.electronAPI.deleteCampaign(id)
    await load()
  }

  function toggleProfile(pid: string) {
    setForm(prev => ({
      ...prev,
      profileIds: prev.profileIds.includes(pid)
        ? prev.profileIds.filter(id => id !== pid)
        : [...prev.profileIds, pid],
    }))
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold mb-1">Campaigns</h1>
          <p className="text-[13px] text-gray-500">{campaigns.length} campaigns</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[12px] font-bold hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5 space-y-4">
          <div className="text-[14px] font-bold">New Campaign</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Campaign name" className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <select value={form.scenarioId} onChange={e => setForm({ ...form, scenarioId: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none bg-white focus:ring-2 focus:ring-indigo-500/30">
              <option value="">Select scenario</option>
              {scenarios.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-gray-500 mb-2">Select Profiles ({form.profileIds.length})</div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {profiles.map(p => (
                <button key={p.id} onClick={() => toggleProfile(p.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                    form.profileIds.includes(p.id)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-400'
                  }`}>
                  {p.name}
                </button>
              ))}
              {profiles.length === 0 && <span className="text-[11px] text-gray-400">No profiles available</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase">Concurrency</label>
              <input type="number" min={1} max={20} value={form.concurrency}
                onChange={e => setForm({ ...form, concurrency: parseInt(e.target.value) || 1 })}
                className="w-full mt-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="text-[12px] font-semibold text-gray-500">Headless</label>
              <button onClick={() => setForm({ ...form, headless: !form.headless })}
                className={`relative w-10 h-5 rounded-full transition-colors ${form.headless ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.headless ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(variables).map(([key, val]) => (
              <div key={key}>
                <label className="text-[10px] font-semibold text-gray-400 uppercase">{`{{${key}}}`}</label>
                <input value={val} onChange={e => setVariables({ ...variables, [key]: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-[12px] outline-none" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[12px] font-bold">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {campaigns.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 grid place-items-center text-rose-600">
                <Activity className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/campaigns/${c.id}`)}>
                <div className="font-bold text-[13.5px] truncate flex items-center gap-2">
                  {c.name}
                  {c.isRunning && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {c.isPaused ? 'Paused' : `Running (${c.activeCount || 0})`}
                    </span>
                  )}
                </div>
                <div className="text-[11.5px] text-gray-400">{c.scenario?.name} · {c._count?.tasks || 0} tasks · concurrency {c.concurrency}</div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {c.isRunning ? (
                  <>
                    {c.isPaused ? (
                      <button onClick={() => resumeCamp(c.id)} title="Resume" className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50"><Play className="w-4 h-4" /></button>
                    ) : (
                      <button onClick={() => pauseCamp(c.id)} title="Pause" className="p-2 rounded-lg text-amber-600 hover:bg-amber-50"><Pause className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => stopCamp(c.id)} title="Stop" className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"><Square className="w-4 h-4" /></button>
                  </>
                ) : (
                  <button onClick={() => startCamp(c.id)} title="Start" className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50"><Play className="w-4 h-4" /></button>
                )}
                <button onClick={() => remove(c.id)} title="Delete" className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50"><Calendar className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-[13px] bg-white rounded-2xl border border-gray-100 shadow-sm">
            <Activity className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            No campaigns yet. Click "New Campaign" to create one.
          </div>
        )}
      </div>
    </div>
  )
}