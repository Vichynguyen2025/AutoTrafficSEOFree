import { useEffect, useState } from 'react'
import { Users, Shield, PlayCircle, ListChecks, Activity } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ profiles: 0, proxies: 0, campaigns: 0, tasks: 0 })

  useEffect(() => {
    async function load() {
      try {
        const [profiles, proxies, campaigns, tasks] = await Promise.all([
          window.electronAPI.getProfiles(),
          window.electronAPI.getProxies(),
          fetch('/api/campaigns-stats').catch(() => ({ json: () => ({ count: 0 }) })),
          fetch('/api/tasks-stats').catch(() => ({ json: () => ({ count: 0 }) })),
        ])
        setStats({
          profiles: profiles.length,
          proxies: proxies.length,
          campaigns: 0,
          tasks: 0,
        })
      } catch {}
    }
    load()
  }, [])

  const cards = [
    { label: 'Profiles', value: stats.profiles, icon: Users, color: 'from-indigo-500 to-blue-600' },
    { label: 'Proxies', value: stats.proxies, icon: Shield, color: 'from-emerald-500 to-teal-600' },
    { label: 'Campaigns', value: stats.campaigns, icon: PlayCircle, color: 'from-amber-500 to-orange-600' },
    { label: 'Tasks', value: stats.tasks, icon: ListChecks, color: 'from-rose-500 to-pink-600' },
  ]

  return (
    <div>
      <h1 className="text-[22px] font-extrabold mb-1">Dashboard</h1>
      <p className="text-[13px] text-gray-500 mb-6">Overview of your browser automation system</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="card p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
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

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-[15px] mb-3">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[13px]">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="font-semibold mb-1">1. Create Profiles</div>
            <div className="text-gray-500">Add browser profiles with unique user-data directories</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="font-semibold mb-1">2. Configure Proxies</div>
            <div className="text-gray-500">Assign proxies to profiles for different IPs</div>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <div className="font-semibold mb-1">3. Run Campaigns</div>
            <div className="text-gray-500">Create scenarios and schedule automated tasks</div>
          </div>
        </div>
      </div>
    </div>
  )
}