// Shared scenario types — used by both frontend and backend
export type StepType =
  | 'open_url' | 'wait' | 'type_text' | 'press_key' | 'click'
  | 'find_element' | 'find_text' | 'find_domain' | 'scroll'
  | 'screenshot' | 'back' | 'forward' | 'close_browser'

export interface StepConfig {
  open_url?: { url: string }
  wait?: { ms: number }
  type_text?: { selector: string; text: string }
  press_key?: { key: string }
  click?: { selector: string }
  find_element?: { selector: string; timeout?: number }
  find_text?: { text: string; timeout?: number }
  find_domain?: { domain: string; timeout?: number }
  scroll?: { direction: 'up' | 'down' | 'to'; amount?: number; selector?: string }
  screenshot?: { path?: string }
  back?: {}
  forward?: {}
  close_browser?: {}
}

export interface ScenarioStep {
  id: string
  type: StepType
  label: string
  config: StepConfig
  enabled: boolean
}

export interface RunLog {
  stepId: string
  stepLabel: string
  type: StepType
  status: 'success' | 'error' | 'warning' | 'running' | 'pending'
  message: string
  durationMs: number
  timestamp: number
  screenshot?: string
}

export const DEFAULT_ACTIONS: { type: StepType; label: string; defaultConfig: StepConfig }[] = [
  { type: 'open_url', label: 'Open URL', defaultConfig: { open_url: { url: 'https://google.com' } } },
  { type: 'wait', label: 'Wait', defaultConfig: { wait: { ms: 2000 } } },
  { type: 'type_text', label: 'Type Text', defaultConfig: { type_text: { selector: 'input[name="q"]', text: '{{keyword}}' } } },
  { type: 'press_key', label: 'Press Key', defaultConfig: { press_key: { key: 'Enter' } } },
  { type: 'click', label: 'Click', defaultConfig: { click: { selector: 'button' } } },
  { type: 'find_element', label: 'Find Element', defaultConfig: { find_element: { selector: 'div', timeout: 5000 } } },
  { type: 'find_text', label: 'Find Text', defaultConfig: { find_text: { text: '{{text}}', timeout: 5000 } } },
  { type: 'find_domain', label: 'Find Domain', defaultConfig: { find_domain: { domain: '{{targetDomain}}', timeout: 10000 } } },
  { type: 'scroll', label: 'Scroll', defaultConfig: { scroll: { direction: 'down', amount: 500 } } },
  { type: 'screenshot', label: 'Screenshot', defaultConfig: { screenshot: {} } },
  { type: 'back', label: 'Back', defaultConfig: { back: {} } },
  { type: 'forward', label: 'Forward', defaultConfig: { forward: {} } },
  { type: 'close_browser', label: 'Close Browser', defaultConfig: { close_browser: {} } },
]

export function createId(): string {
  return Math.random().toString(36).substring(2, 10)
}

export function createGoogleSearchSteps(): ScenarioStep[] {
  return [
    { id: createId(), type: 'open_url', label: 'Open Google', config: { open_url: { url: 'https://google.com' } }, enabled: true },
    { id: createId(), type: 'wait', label: 'Wait for page', config: { wait: { ms: 2000 } }, enabled: true },
    { id: createId(), type: 'type_text', label: 'Type keyword', config: { type_text: { selector: 'textarea[name="q"], input[name="q"]', text: '{{keyword}}' } }, enabled: true },
    { id: createId(), type: 'press_key', label: 'Press Enter', config: { press_key: { key: 'Enter' } }, enabled: true },
    { id: createId(), type: 'wait', label: 'Wait for results', config: { wait: { ms: 3000 } }, enabled: true },
    { id: createId(), type: 'find_domain', label: 'Find target domain', config: { find_domain: { domain: '{{targetDomain}}', timeout: 15000 } }, enabled: true },
    { id: createId(), type: 'click', label: 'Click result', config: { click: { selector: 'a[href*="{{targetDomain}}"]' } }, enabled: true },
    { id: createId(), type: 'wait', label: 'Wait for page load', config: { wait: { ms: 5000 } }, enabled: true },
    { id: createId(), type: 'screenshot', label: 'Take screenshot', config: { screenshot: {} }, enabled: true },
    { id: createId(), type: 'close_browser', label: 'Close browser', config: { close_browser: {} }, enabled: true },
  ]
}