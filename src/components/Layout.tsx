import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Shield, FileJson, PlayCircle, ListChecks,
  ScrollText, Settings, Activity,
} from 'lucide-react'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profiles', label: 'Profiles', icon: Users },
  { to: '/proxies', label: 'Proxies', icon: Shield },
  { to: '/scenarios', label: 'Scenarios', icon: FileJson },
  { to: '/campaigns', label: 'Campaigns', icon: PlayCircle },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/logs', label: 'Logs', icon: ScrollText },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Titlebar */}
      <div className="titlebar" />

      {/* Sidebar */}
      <aside className="w-[240px] bg-white border-r border-gray-200 flex flex-col shrink-0 pt-8">
        <div className="px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="font-extrabold text-[15px]">AutoTrafficSEO</div>
              <div className="text-[9.5px] text-gray-400">Browser Automation</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`
              }
            >
              <n.icon className="w-4.5 h-4.5" />
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-[10px] text-gray-400">v1.0.0 · Electron + Playwright</div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto pt-8">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}