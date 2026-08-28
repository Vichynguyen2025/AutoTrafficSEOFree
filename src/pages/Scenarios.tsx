import { FileJson, Loader2 } from 'lucide-react'

export default function Scenarios() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold mb-1">Scenarios</h1>
        <p className="text-[13px] text-gray-500">Create automation workflows (Phase 2)</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <FileJson className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <div className="text-[14px] font-semibold text-gray-500">Scenarios — Coming in Phase 2</div>
        <div className="text-[12px] text-gray-400 mt-1">Build automation workflows with steps like Open URL, Click, Type, Scroll</div>
      </div>
    </div>
  )
}