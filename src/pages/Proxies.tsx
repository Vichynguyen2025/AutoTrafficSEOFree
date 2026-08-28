import { useEffect, useState } from 'react'
import { Plus, Trash2, TestTube, Download, Loader2 } from 'lucide-react'

interface ProxyItem {
  id: string
  host: string
  port: number
  type: string
  username: string | null
  password: string | null
  status: string
  note: string | null
}

export default function Proxies() {
  const [proxies, setProxies] = useState<ProxyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ host: '', port: '80', type: 'http', username: '', password: '', note: '' })
  const [importText, setImportText] = useState('')
  const [testing, setTesting] = useState<string | null>(null)

  async function load() {
    try {
      const data = await window.electronAPI.getProxies()
      setProxies(data)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function create() {
    if (!form.host.trim() || !form.port) return
    await window.electronAPI.createProxy({
      host: form.host, port: parseInt(form.port), type: form.type,
      username: form.username || null, password: form.password || null,
      note: form.note || null,
    })
    setForm({ host: '', port: '80', type: 'http', username: '', password: '', note: '' })
    setShowForm(false)
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this proxy?')) return
    await window.electronAPI.deleteProxy(id)
    await load()
  }

  async function testProxy(id: string) {
    setTesting(id)
    await window.electronAPI.testProxy(id)
    setTesting(null)
    await load()
  }

  async function importProxies() {
    if (!importText.trim()) return
    await window.electronAPI.importProxies(importText)
    setImportText('')
    await load()
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-extrabold mb-1">Proxies</h1>
          <p className="text-[13px] text-gray-500">{proxies.length} proxies</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[12px] font-bold hover:shadow-lg transition-all">
          <Plus className="w-4 h-4" /> Add Proxy
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-4 bg-white rounded-2xl border border-gray-200 shadow-sm mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <input value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })}
              placeholder="IP/Host" className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <input value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })}
              placeholder="Port" className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white">
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
              <option value="socks5">SOCKS5</option>
            </select>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Note" className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username (optional)" className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30" />
            <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password (optional)" type="password" className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30" />
          </div>
          <div className="flex gap-2">
            <button onClick={create} className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-[12px] font-bold">Add</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-600">Cancel</button>
          </div>
        </div>
      )}

      {/* Import */}
      <details className="mb-4">
        <summary className="text-[12px] font-semibold text-indigo-600 cursor-pointer flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Import proxies from list
        </summary>
        <div className="mt-2">
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)}
            placeholder="One proxy per line:&#10;ip:port&#10;ip:port:username:password"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30 h-24 resize-none" />
          <button onClick={importProxies} className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-[12px] font-bold">Import</button>
        </div>
      </details>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {proxies.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 grid place-items-center text-emerald-600 font-bold text-[13px]">
                {p.type.toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[13.5px] truncate flex items-center gap-2">
                  {p.host}:{p.port}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                    p.status === 'ok' ? 'bg-emerald-100 text-emerald-700' :
                    p.status === 'error' ? 'bg-rose-100 text-rose-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {p.status}
                  </span>
                </div>
                <div className="text-[11.5px] text-gray-400 truncate">
                  {p.type} · {p.note || 'No note'}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => testProxy(p.id)} disabled={testing === p.id} title="Test"
                  className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                  {testing === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                </button>
                <button onClick={() => remove(p.id)} title="Delete"
                  className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {proxies.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-[13px]">
              No proxies yet. Click "Add Proxy" or import a list.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}