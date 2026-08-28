import { useEffect, useState } from 'react'
import { ScrollText, Loader2, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  async function load() {
    try {
      const campaigns = await window.electronAPI.getCampaigns()
      const allLogs: any[] = []
      for (const c of campaigns) {
        const stats = await window.electronAPI.getCampaignStats(c.id)
        if (stats?.logs) {
          allLogs.push(...stats.logs.map((l: any) => ({ ...l, campaignName: c.name })))
        }
      }
      setLogs(allLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load(); const i = setInterval(load, 5000); return () => clearInterval(i) }, [])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.level === filter)

  const icon = (level: string) => {
    switch (level) {
      case 'success': return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
      case 'error': return <XCircle className="w-3.5 h-3.5 text-rose-500" />
      case 'warning': return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
      default: return <Info className="w-3.5 h-3.5 text-gray-400" />
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold mb-1">Logs</h1>
        <p className="text-[13px] text-gray-500">{logs.length} entries</p>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {['all', 'success', 'error', 'warning', 'info'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {f.charAt(0).toUpperCase() + f.slice(1)} ({f === 'all' ? logs.length : logs.filter(l => l.level === f).length})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
          {filtered.slice(0, 200).map((log, i) => (
            <div key={i} className={`px-4 py-2.5 flex items-start gap-2.5 text-[12px] ${
              log.level === 'error' ? 'bg-rose-50/50' : log.level === 'success' ? 'bg-emerald-50/30' : ''
            }`}>
              <div className="mt-0.5 shrink-0">{icon(log.level)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-gray-700">{log.message}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {log.campaignName ? `Campaign: ${log.campaignName} · ` : ''}
                  {new Date(log.createdAt || Date.now()).toLocaleString()}
                </div>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                log.level === 'error' ? 'bg-rose-100 text-rose-700' :
                log.level === 'success' ? 'bg-emerald-100 text-emerald-700' :
                log.level === 'warning' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {log.level.toUpperCase()}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-[13px]">
              <ScrollText className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              No logs found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}