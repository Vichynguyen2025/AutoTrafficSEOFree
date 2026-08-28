import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown, Save, ArrowLeft, Play, Loader2 } from 'lucide-react'
import type { ScenarioStep, StepType, StepConfig } from '../types/scenario'
import { DEFAULT_ACTIONS, createId, createGoogleSearchSteps } from '../types/scenario'

export default function ScenarioEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<ScenarioStep[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [showAddMenu, setShowAddMenu] = useState(false)

  useEffect(() => {
    if (!isNew) {
      window.electronAPI.getScenario(id!).then((s: any) => {
        if (s) {
          setName(s.name)
          setDescription(s.description || '')
          try { setSteps(JSON.parse(s.steps)) } catch { setSteps([]) }
        }
        setLoading(false)
      })
    }
  }, [id])

  function addStep(type: StepType) {
    const action = DEFAULT_ACTIONS.find(a => a.type === type)
    if (!action) return
    const newStep: ScenarioStep = {
      id: createId(),
      type,
      label: action.label,
      config: JSON.parse(JSON.stringify(action.defaultConfig)),
      enabled: true,
    }
    setSteps([...steps, newStep])
    setShowAddMenu(false)
  }

  function removeStep(stepId: string) {
    setSteps(steps.filter(s => s.id !== stepId))
  }

  function moveStep(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= steps.length) return
    const arr = [...steps]
    ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
    setSteps(arr)
  }

  function toggleStep(stepId: string) {
    setSteps(steps.map(s => s.id === stepId ? { ...s, enabled: !s.enabled } : s))
  }

  function updateStepConfig(stepId: string, config: StepConfig) {
    setSteps(steps.map(s => s.id === stepId ? { ...s, config } : s))
  }

  function updateStepLabel(stepId: string, label: string) {
    setSteps(steps.map(s => s.id === stepId ? { ...s, label } : s))
  }

  function getConfigFields(step: ScenarioStep): { key: string; label: string; type: 'text' | 'number' | 'select'; value: string; options?: { value: string; label: string }[] }[] {
    const fields: any[] = []
    const c = step.config
    switch (step.type) {
      case 'open_url': fields.push({ key: 'open_url.url', label: 'URL', type: 'text', value: c.open_url?.url || '' }); break
      case 'wait': fields.push({ key: 'wait.ms', label: 'Milliseconds', type: 'number', value: String(c.wait?.ms || 2000) }); break
      case 'type_text':
        fields.push({ key: 'type_text.selector', label: 'CSS Selector', type: 'text', value: c.type_text?.selector || '' })
        fields.push({ key: 'type_text.text', label: 'Text', type: 'text', value: c.type_text?.text || '' }); break
      case 'press_key': fields.push({ key: 'press_key.key', label: 'Key', type: 'text', value: c.press_key?.key || 'Enter' }); break
      case 'click': fields.push({ key: 'click.selector', label: 'CSS Selector', type: 'text', value: c.click?.selector || '' }); break
      case 'find_element':
        fields.push({ key: 'find_element.selector', label: 'CSS Selector', type: 'text', value: c.find_element?.selector || '' })
        fields.push({ key: 'find_element.timeout', label: 'Timeout (ms)', type: 'number', value: String(c.find_element?.timeout || 5000) }); break
      case 'find_text':
        fields.push({ key: 'find_text.text', label: 'Text to find', type: 'text', value: c.find_text?.text || '' })
        fields.push({ key: 'find_text.timeout', label: 'Timeout (ms)', type: 'number', value: String(c.find_text?.timeout || 5000) }); break
      case 'find_domain':
        fields.push({ key: 'find_domain.domain', label: 'Domain', type: 'text', value: c.find_domain?.domain || '' })
        fields.push({ key: 'find_domain.timeout', label: 'Timeout (ms)', type: 'number', value: String(c.find_domain?.timeout || 10000) }); break
      case 'scroll':
        fields.push({ key: 'scroll.direction', label: 'Direction', type: 'select', value: c.scroll?.direction || 'down', options: [{ value: 'up', label: 'Up' }, { value: 'down', label: 'Down' }, { value: 'to', label: 'To Element' }] })
        if (c.scroll?.direction === 'to') {
          fields.push({ key: 'scroll.selector', label: 'Selector', type: 'text', value: c.scroll?.selector || '' })
        } else {
          fields.push({ key: 'scroll.amount', label: 'Pixels', type: 'number', value: String(c.scroll?.amount || 500) })
        }
        break
      case 'screenshot': fields.push({ key: 'screenshot.path', label: 'Save path (optional)', type: 'text', value: c.screenshot?.path || '' }); break
    }
    return fields
  }

  function setField(stepId: string, key: string, value: string) {
    const parts = key.split('.')
    const step = steps.find(s => s.id === stepId)
    if (!step) return
    const config = { ...step.config }
    const section = config[parts[0] as keyof StepConfig]
    if (section) {
      (section as any)[parts[1]] = parts[1] === 'ms' || parts[1] === 'timeout' || parts[1] === 'amount' ? Number(value) : value
    }
    updateStepConfig(stepId, config)
  }

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const data = { name, description, steps }
      if (isNew) {
        await window.electronAPI.createScenario(data)
      } else {
        await window.electronAPI.updateScenario(id!, data)
      }
      navigate('/scenarios')
    } catch (e: any) { alert(e.message) }
    setSaving(false)
  }

  async function runNow() {
    if (steps.length === 0) return
    // Save first, then navigate to run page
    if (isNew) {
      const data = { name, description, steps }
      const created = await window.electronAPI.createScenario(data)
      navigate(`/scenarios/${created.id}/run`)
    } else {
      await window.electronAPI.updateScenario(id!, { name, description, steps })
      navigate(`/scenarios/${id}/run`)
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-gray-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>

  const actionIcons: Record<string, string> = {
    open_url: '🌐', wait: '⏳', type_text: '✏️', press_key: '⌨️', click: '🖱️',
    find_element: '🔍', find_text: '📄', find_domain: '🔗', scroll: '📜',
    screenshot: '📸', back: '◀️', forward: '▶️', close_browser: '🛑',
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/scenarios')} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold mb-1">{isNew ? 'New Scenario' : 'Edit Scenario'}</h1>
            <p className="text-[13px] text-gray-500">{steps.length} steps</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={runNow} disabled={steps.length === 0} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-[12px] font-bold hover:bg-emerald-700 disabled:opacity-50">
            <Play className="w-4 h-4" /> Run
          </button>
          <button onClick={save} disabled={saving || !name.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[12px] font-bold hover:shadow-lg disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </div>

      {/* Name & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Scenario name"
          className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-indigo-500/30" />
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
          className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/30" />
      </div>

      {/* Steps */}
      <div className="space-y-2 mb-5">
        {steps.map((step, i) => {
          const fields = getConfigFields(step)
          return (
            <div key={step.id} className={`bg-white rounded-xl border transition-all ${step.enabled ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-50'}`}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className="text-gray-300 cursor-grab"><GripVertical className="w-4 h-4" /></span>
                <span className="text-[16px] shrink-0">{actionIcons[step.type] || '⚙️'}</span>
                <span className="text-[10px] font-bold text-gray-400 w-6">#{i + 1}</span>
                <input value={step.label} onChange={e => updateStepLabel(step.id, e.target.value)}
                  className="font-semibold text-[13px] bg-transparent outline-none flex-1 min-w-0" />
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleStep(step.id)} className={`p-1.5 rounded-lg text-[10px] ${step.enabled ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                    {step.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => moveStep(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => moveStep(i, 1)} disabled={i === steps.length - 1} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => removeStep(step.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {fields.length > 0 && (
                <div className="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fields.map(f => (
                    f.type === 'select' ? (
                      <select key={f.key} value={f.value} onChange={e => setField(step.id, f.key, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11.5px] outline-none bg-white">
                        {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input key={f.key} type={f.type} value={f.value} onChange={e => setField(step.id, f.key, e.target.value)}
                        placeholder={f.label} className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-[11.5px] outline-none focus:ring-1 focus:ring-indigo-500/30" />
                    )
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {steps.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-[13px] bg-white rounded-xl border border-dashed border-gray-200">
            No steps yet. Click "Add Step" below to begin.
          </div>
        )}
      </div>

      {/* Add Step */}
      <div className="relative">
        <button onClick={() => setShowAddMenu(!showAddMenu)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-dashed border-gray-300 text-[12px] font-semibold text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
          <Plus className="w-4 h-4" /> Add Step
        </button>

        {showAddMenu && (
          <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-lg p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 max-h-60 overflow-y-auto">
            {DEFAULT_ACTIONS.map(a => (
              <button key={a.type} onClick={() => addStep(a.type)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-[11.5px] font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left">
                <span className="text-[14px]">{actionIcons[a.type] || '⚙️'}</span>
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}