import { Settings as SettingsIcon, Save, Loader2 } from 'lucide-react'

export default function Settings() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold mb-1">Settings</h1>
        <p className="text-[13px] text-gray-500">Application configuration</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl">
        <div className="text-[14px] font-semibold mb-4">Database Connection</div>
        <div className="text-[13px] text-gray-500 mb-2">
          Configure via <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600">.env</code> file:
        </div>
        <div className="bg-gray-50 rounded-xl p-3.5 text-[12px] font-mono text-gray-600 mb-4">
          DATABASE_URL="mysql://user:password@localhost:3306/autotraffic_seo"
        </div>
        <div className="text-[13px] text-gray-500">Prisma handles schema migrations automatically on startup.</div>
      </div>
    </div>
  )
}