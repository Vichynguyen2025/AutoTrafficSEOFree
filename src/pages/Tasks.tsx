import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListChecks, Loader2, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react'

interface TaskItem {
  id: string
  status: string
  profileId: string
  campaignId: string
  retryCount: number
  maxRetries: number
  createdAt: string
  profile: { id: string; name: string }
  campaign: { id: string; name: string }
  logs: { id: string; level: string; message: string }[]
}

export default function Tasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()

  async function load() {
    try {
      const campaigns = await window.electronAPI.getCampaigns()
      // Get all tasks from all campaigns
      const allTasks: TaskItem[] = []
      for (const c of campaigns) {
        const detail = await window.electronAPI.getCampaign(c.id)
        if (detail?.tasks) {
          allTasks.push(...detail.tasks.map((t: any) => ({ ...t, campaign: { id: c.id, name: c.name } })))
        }
      }
      setTasks(allTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load(); const i = setInterval(load, 3000); return () => clearInterval(i) }, [])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

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

  const filters = ['all', 'pending', 'running', 'completed', 'failed', 'cancelled']

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold mb-1">Tasks</h1>
        <p className="text-[13px] text-gray-500">{tasks.length} tasks · {tasks.filter(t => t.status === 'running').length} running</p>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? tasks.length : tasks.filter(t => t.status === f).length})
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-[13px]">
            <ListChecks className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            No tasks found
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.slice(0, 100).map(t => (
              <div key={t.id} className="px-4 py-3 flex items-center gap-3 text-[12px] hover:bg-gray-50">
                <div className="shrink-0">{statusIcon(t.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    {t.profile?.name || 'Unknown'}
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                    <span className="text-gray-500 font-normal">{t.campaign?.name || 'Unknown'}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Created {new Date(t.createdAt).toLocaleString()} · Retry {t.retryCount || 0}/{t.maxRetries || 3}
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(t.status)}`}>
                  {t.status}
                </span>
                <button onClick={() => navigate(`/campaigns/${t.campaignId}`)} className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}