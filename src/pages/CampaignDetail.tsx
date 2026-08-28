import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Play, Square, Pause, ArrowLeft, Loader2, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react'

export default function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [campaign, setCampaign] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<any>(null)

  async function load() {
    if (!id) return
    const [c, s] = await Promise.all([
      window.electronAPI.getCampaign(id),
      window.electronAPI.getCampaignStats(id),
    ])
    setCampaign(c)
    setStats(s)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // Poll every 2 seconds for active campaigns
    pollRef.current = setInterval(async () => {
      if (!id) return
      const s = await window.electronAPI.getCampaignStats(id)
      setStats(s)
      const c = await window.electronAPI.getCampaign(id)
      setCampaign(c)
    }, 2000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id])

  async function startC() { if (id) { await window.electronAPI.startCampaign(id); load() } }
  async function stopC() { if (id) { await window.electronAPI.stopCampaign(id); load() } }
  async function pauseC() { if (id) { await window.electronAPI.pauseCampaign(id); load() } }
  async function resumeC() { if (id) { await window.electronAPI.resumeCampaign(id); load() } }

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-emerald-100 text-emerald-700'
      case 'failed': return 'bg-rose-100 text-rose-700'
      case 'running': return 'bg-blue-100 text-blue-700'
      case 'pending': return 'bg-gray-100 text-gray-500'
      case 'cancelled': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-500'
    }
  }

  const statusIcon = (s: string) => {
    switch (s) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-rose-500" />
      case 'running': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
      case 'pending': return <Clock className="w-4 h-4 text-gray-300" />
      case 'cancelled': return <AlertTriangle className="w-4 h-4 text-amber-500" />
      default: return <Clock className="w-4 h-4 text-gray-300" />
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>
  if (!campaign) return <div className="text-gray-500 py-10">Campaign not found</div>

  const statCards = [
    { label: 'Total', value: stats?.total || 0, color: 'text-gray-700' },
    { label: 'Pending', value: stats?.pending || 0, color: 'text-gray-500' },
    { label: 'Running', value: stats?.running || 0, color: 'text-blue-600' },
    { label: 'Completed', value: stats?.completed || 0, color: 'text-emerald-600' },
    { label: 'Failed', value: stats?.failed || 0, color: 'text-rose-600' },
    { label: 'Cancelled', value: stats?.cancelled || 0, color: 'text-amber-600' },
  ]

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/campaigns')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold mb-1">{campaign.name}</h1>
            <p className="text-[13px] text-gray-500">
              {campaign.scenario?.name} · {campaign.concurrency} concurrency · {campaign.isRunning ? (campaign.isPaused ? '⏸️ Paused' : '▶️ Running') : '⏹️ Stopped'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {campaign.isRunning ? (
            <>
              {campaign.isPaused ? (
                <button onClick={resumeC} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-[12px] font-bold"><Play className="w-4 h-4" /> Resume</button>
              ) : (
                <button onClick={pauseC} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 text-white text-[12px] font-bold"><Pause className="w-4 h-4" /> Pause</button>
              )}
              <button onClick={stopC} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 text-white text-[12px] font-bold"><Square className="w-4 h-4" /> Stop</button>
            </>
          ) : (
            <button onClick={startC} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[12px] font-bold hover:shadow-lg">
              <Play className="w-4 h-4" /> Start
            </button>
          )}
          <button onClick={load} className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">
        {statCards.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <div className={`text-[22px] font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-[10px] text-gray-400 font-semibold uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-[13px] font-bold">Tasks ({campaign.tasks?.length || 0})</div>
        </div>
        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
          {campaign.tasks?.map((t: any) => (
            <div key={t.id} className="px-4 py-2.5 flex items-center gap-3 text-[12px] hover:bg-gray-50">
              <div className="shrink-0">{statusIcon(t.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-800">{t.profile?.name || 'Unknown'}</div>
                <div className="text-[10px] text-gray-400">
                  {t.status} · retry {t.retryCount || 0}/{t.maxRetries || 3}
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(t.status)}`}>
                {t.status}
              </span>
            </div>
          ))}
          {(!campaign.tasks || campaign.tasks.length === 0) && (
            <div className="text-center py-8 text-gray-400 text-[13px]">No tasks</div>
          )}
        </div>
      </div>

      {/* Logs */}
      {stats?.logs && stats.logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="text-[13px] font-bold">Recent Logs</div>
          </div>
          <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {stats.logs.slice(-50).map((log: any, i: number) => (
              <div key={i} className={`px-4 py-2 text-[11px] ${log.level === 'error' ? 'bg-rose-50/50' : log.level === 'success' ? 'bg-emerald-50/30' : ''}`}>
                <span className={`font-semibold ${log.level === 'error' ? 'text-rose-600' : log.level === 'success' ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="text-gray-600 ml-2">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}