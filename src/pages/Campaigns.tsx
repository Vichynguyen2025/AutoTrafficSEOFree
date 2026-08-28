import { PlayCircle, Loader2 } from 'lucide-react'

export default function Campaigns() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold mb-1">Campaigns</h1>
        <p className="text-[13px] text-gray-500">Schedule and manage automation runs (Phase 2)</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <PlayCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <div className="text-[14px] font-semibold text-gray-500">Campaigns — Coming in Phase 2</div>
        <div className="text-[12px] text-gray-400 mt-1">Run scenarios with profiles, concurrency control, scheduler</div>
      </div>
    </div>
  )
}