import { useEffect, useState } from 'react'
import { Plus, Trash2, Play, Copy, FileJson, Loader2, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface Scenario {
  id: string
  name: string
  description: string | null
  steps: string
  createdAt: string
}

export default function Scenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function load() {
    try {
      const data = await window.electronAPI.getScenarios()
      setScenarios(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function remove(id: string) {
    if (!confirm('Delete this scenario?')) return
    await window.electronAPI.deleteScenario(id)
    await load()
  }

  async function createGoogleSearch() {
    const { createGoogleSearchSteps } = await import('../types/scenario')
    const steps = createGoogleSearchSteps()
    await window.electronAPI.createScenario({
      name: 'Google Search → Target Domain',
      description: 'Search Google for a keyword, find the target domain link, and visit the website.',
      steps,
    })
    await load()
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold mb-1">Scenarios</h1>
          <p className="text-[13px] text-gray-500">{scenarios.length} automation workflows</p>
        </div>
        <div className="flex gap-2">
          <button onClick={createGoogleSearch} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 text-indigo-600 text-[12px] font-semibold hover:bg-indigo-50">
            <Search className="w-4 h-4" /> Google Search Sample
          </button>
          <button onClick={() => navigate('/scenarios/new')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[12px] font-bold hover:shadow-lg transition-all">
            <Plus className="w-4 h-4" /> New Scenario
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {scenarios.map((s) => {
            let stepCount = 0
            try { const steps = JSON.parse(s.steps); stepCount = steps.length } catch {}
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 grid place-items-center text-amber-600">
                  <FileJson className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/scenarios/${s.id}`)}>
                  <div className="font-bold text-[13.5px] truncate">{s.name}</div>
                  <div className="text-[11.5px] text-gray-400 truncate">{stepCount} steps · {s.description || 'No description'}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => navigate(`/scenarios/${s.id}/run`)} title="Run"
                    className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                    <Play className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate(`/scenarios/${s.id}`)} title="Edit"
                    className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(s.id)} title="Delete"
                    className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
          {scenarios.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-[13px]">
              No scenarios yet. Create one or click "Google Search Sample".
            </div>
          )}
        </div>
      </div>
    </div>
  )
}