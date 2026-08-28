import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Square, Loader2, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'
import type { ScenarioStep, RunLog } from '../types/scenario'

export default function ScenarioRun() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [scenario, setScenario] = useState<any>(null)
  const [steps, setSteps] = useState<ScenarioStep[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState('')
  const [variables, setVariables] = useState<Record<string, string>>({ keyword: '', targetDomain: '', url: '', text: '' })
  const [logs, setLogs] = useState<RunLog[]>([])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      window.electronAPI.getScenario(id!),
      window.electronAPI.getProfiles(),
    ]).then(([s, p]) => {
      if (s) {
        setScenario(s)
        try { const parsed = JSON.parse(s.steps); setSteps(parsed) } catch {}
      }
      setProfiles(p)
      if (p.length > 0) setSelectedProfile(p[0].id)
      setLoading(false)
    })
  }, [id])

  async function run() {
    if (!selectedProfile || steps.length === 0) return
    setRunning(true)
    setLogs([])
    setResult(null)

    try {
      const res = await window.electronAPI.runScenario({
        profileId: selectedProfile,
        steps,
        variables,
      })
      setLogs(res.logs || [])
      setResult(res)
    } catch (e: any) {
      setLogs(prev => [...prev, {
        stepId: 'error', stepLabel: 'Error', type: 'close_browser',
        status: 'error', message: e.message, durationMs: 0, timestamp: Date.now(),
      }])
    }
    setRunning(false)
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'error': return <XCircle className="w-4 h-4 text-rose-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case 'running': return <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
      default: return <Clock className="w-4 h-4 text-gray-300" />
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/scenarios/${id}`)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold mb-1">Run Scenario</h1>
            <p className="text-[13px] text-gray-500">{scenario?.name || 'Unknown'} · {steps.length} steps</p>
          </div>
        </div>
        <button onClick={run} disabled={running || !selectedProfile}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all ${
            running ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg'
          } disabled:opacity-50`}>
          {running ? <><Square className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> Run</>}
        </button>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {/* Profile + Variables */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="text-[13px] font-bold">Configuration</div>
          <select value={selectedProfile} onChange={e => setSelectedProfile(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none bg-white focus:ring-2 focus:ring-indigo-500/30">
            <option value="">Select a profile</option>
            {profiles.map(p => <option key={p.id} value={p.id}>{p.name} {p.proxy ? `(🔒 ${p.proxy.host})` : ''}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(variables).map(([key, val]) => (
              <div key={key}>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{`{{${key}}}`}</label>
                <input value={val} onChange={e => setVariables({ ...variables, [key]: e.target.value })}
                  placeholder={key === 'keyword' ? 'e.g. quán cafe Hà Nội' : key === 'targetDomain' ? 'e.g. gocoffee.bio' : `Enter ${key}`}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-[12px] outline-none focus:ring-1 focus:ring-indigo-500/30" />
              </div>
            ))}
          </div>
        </div>

        {/* Steps summary */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="text-[13px] font-bold mb-3">Steps ({steps.length})</div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {steps.map((s, i) => (
              <div key={s.id} className={`flex items-center gap-2 text-[11.5px] px-2 py-1.5 rounded-lg ${s.enabled ? 'text-gray-700' : 'text-gray-400 line-through'}`}>
                <span className="text-gray-300 w-4 text-[10px]">{i + 1}</span>
                <span>{s.label}</span>
                {!s.enabled && <span className="text-[9px] text-gray-400">(disabled)</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-3">
          <span className={`text-[13px] font-bold ${result.success ? 'text-emerald-600' : 'text-rose-600'}`}>
            {result.success ? '✅ Completed' : '❌ Failed'}
          </span>
          <span className="text-[11px] text-gray-500">
            {(result.totalDurationMs / 1000).toFixed(1)}s · {logs.filter(l => l.status === 'success').length} success, {logs.filter(l => l.status === 'error').length} errors
          </span>
          {result.error && <span className="text-[11px] text-rose-500 ml-2">{result.error}</span>}
        </div>
      )}

      {/* Logs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-[13px] font-bold">Execution Logs</div>
          <div className="text-[11px] text-gray-400">{logs.length} entries</div>
        </div>
        <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
          {logs.length === 0 && !running && (
            <div className="text-center py-12 text-gray-400 text-[13px]">
              Click "Run" to execute the scenario.
            </div>
          )}
          {logs.length === 0 && running && (
            <div className="text-center py-12 text-gray-400 text-[13px] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Running...
            </div>
          )}
          {logs.map((log, i) => (
            <div key={i} className={`px-4 py-2.5 flex items-start gap-3 text-[12px] ${
              log.status === 'error' ? 'bg-rose-50/50' : log.status === 'warning' ? 'bg-amber-50/50' : ''
            }`}>
              <div className="mt-0.5 shrink-0">{getStatusIcon(log.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{log.stepLabel}</span>
                  <span className="text-[10px] text-gray-400">({log.durationMs}ms)</span>
                </div>
                <div className="text-gray-500 mt-0.5 text-[11.5px]">{log.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}