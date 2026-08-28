import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Shield, PlayCircle, ListChecks, Activity, Loader2, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, running: 0, pending: 0, completed: 0, failed: 0, cancelled: 0 })
  const [profileCount, setProfileCount] = useState(0)
  const [proxyCount, setProxyCount] = useState(0)
  const [campaignCount, setCampaignCount] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [gs, profiles, proxies, campaigns] = await Promise.all([
          window.electronAPI.getGlobalStats().catch(() => ({ total: 0, running: 0, pending: 0, completed: 0, failed: 0, cancelled: 0 })),
          window.electronAPI.getProfiles(),
          window.electronAPI.getProxies(),
          window.electronAPI.getCampaigns(),
        ])
        setStats(gs)
        setProfileCount(profiles.length)
        setProxyCount(proxies.length)
        setCampaignCount(campaigns.length)
      } catch {}
    }
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  const cards = [
    { label: 'Profiles', value: profileCount, icon: Users, color: 'from-indigo-500 to-blue-600', path: '/profiles' },
    { label: 'Proxies', value: proxyCount, icon: Shield, color: 'from-emerald-500 to-teal-600', path: '/proxies' },
    { label: 'Campaigns', value: campaignCount, icon: PlayCircle, color: 'from-amber-500 to-orange-600', path: '/campaigns' },
    { label: 'Tasks', value: stats.total, icon: ListChecks, color: 'from-rose-500 to-pink-600', path: '/tasks' },
  ]

  const taskStats = [
    { label: 'Running', value: stats.running, icon: Activity, color: 'text-blue-600 bg-blue-50' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-gray-500 bg-gray-100' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-rose-600 bg-rose-50' },
  ]

  return (
    <div>
      <h1 className="text-[22px] font-extrabold mb-1">Dashboard</h1>
      <p className="text-[13px] text-gray-500 mb-6">Overview of your browser automation system</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c) => (
          <div key={c.label} onClick={() => navigate(c.path)} className="card p-5 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} grid place-items-center text-white shadow-sm`}>
                <c.icon className="w-5 h-5" />
              </span>
              <div className="text-[28px] font-extrabold">{c.value}</div>
            </div>
            <div className="text-[12.5px] text-gray-500 font-medium">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Task Status */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="font-bold text-[15px] mb-4 flex items-center gap-2">
          <TrendingUp className="w-4.5 h-4.5 text-indigo-500" />
          Task Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {taskStats.map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color.replace('text-', '')}`}>
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-5 h-5 ${s.color.split(' ')[0]}`} />
              </div>
              <div className="text-[24px] font-extrabold">{s.value}</div>
              <div className="text-[11px] font-semibold opacity-70">{s.label}</div>
            </div>
          ))}
          {stats.total === 0 && (
            <div className="col-span-4 text-center py-6 text-gray-400 text-[13px]">
              No tasks yet. Create a campaign to get started.
            </div>
          )}
        </div>
      </div>

      {/* Quick Start */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-[15px] mb-3">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[13px]">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="font-semibold mb-1">1. Create Profiles</div>
            <div className="text-gray-500">Add browser profiles with unique user-data directories</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="font-semibold mb-1">2. Configure Proxies</div>
            <div className="text-gray-500">Assign proxies to profiles for different IPs</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="font-semibold mb-1">3. Build Scenarios</div>
            <div className="text-gray-500">Create automation workflows with 13 action types</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="font-semibold mb-1">4. Run Campaigns</div>
            <div className="text-gray-500">Select profiles + scenario, set concurrency, and launch</div>
          </div>
        </div>
      </div>
    </div>
  )
}