import { chromium, BrowserContext, Page } from 'playwright'
import { getPrisma } from '../prisma'
import path from 'path'
import { app } from 'electron'
import type { ScenarioStep, StepType, RunLog, ScenarioResult } from '../ipc/types'


const prisma = getPrisma()
function resolveVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key) => vars[key] || '')
}

export async function runScenario(
  profileId: string,
  steps: ScenarioStep[],
  variables: Record<string, string>,
  options?: { headless?: boolean },
  onLog?: (log: RunLog) => void
): Promise<ScenarioResult> {
  const logs: RunLog[] = []
  const startTime = Date.now()
  let context: BrowserContext | null = null
  let page: Page | null = null
  const headless = options?.headless !== undefined ? options.headless : false // default: visible

  function addLog(stepId: string, stepLabel: string, type: StepType, status: RunLog['status'], message: string, dur = 0) {
    const entry: RunLog = { stepId, stepLabel, type, status, message, durationMs: dur, timestamp: Date.now() }
    logs.push(entry)
    onLog?.(entry)
  }

  try {
    const profile = await prisma.profile.findUnique({ where: { id: profileId }, include: { proxy: true } })
    if (!profile) return { success: false, logs, totalDurationMs: Date.now() - startTime, error: 'Profile not found' }

    const userDataDir = profile.userDataDir || path.join(app.getPath('userData'), 'profiles', profile.id)
    const launchOptions: any = { headless, userDataDir }

    if (profile.proxy) {
      const p = profile.proxy
      launchOptions.proxy = {
        server: `${p.type}://${p.host}:${p.port}`,
        username: p.username || undefined,
        password: p.password || undefined,
      }
    }

    context = await chromium.launchPersistentContext(userDataDir, launchOptions)
    page = context.pages()[0] || await context.newPage()

    for (const step of steps) {
      if (!step.enabled) {
        addLog(step.id, step.label, step.type, 'warning', '⏭️ Skipped (disabled)', 0)
        continue
      }

      const stepStart = Date.now()

      try {
        switch (step.type) {
          case 'open_url': {
            const url = resolveVars(step.config.open_url?.url || '', variables)
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
            addLog(step.id, step.label, step.type, 'success', `✅ Opened ${url}`, Date.now() - stepStart)
            break
          }

          case 'wait': {
            const ms = step.config.wait?.ms || 2000
            await page.waitForTimeout(ms)
            addLog(step.id, step.label, step.type, 'success', `⏳ Waited ${ms}ms`, Date.now() - stepStart)
            break
          }

          case 'type_text': {
            const selector = resolveVars(step.config.type_text?.selector || '', variables)
            const text = resolveVars(step.config.type_text?.text || '', variables)
            await page.waitForSelector(selector, { timeout: 10000 })
            await page.fill(selector, '')
            await page.type(selector, text, { delay: 50 })
            addLog(step.id, step.label, step.type, 'success', `✏️ Typed "${text}" into ${selector}`, Date.now() - stepStart)
            break
          }

          case 'press_key': {
            const key = step.config.press_key?.key || 'Enter'
            await page.keyboard.press(key)
            addLog(step.id, step.label, step.type, 'success', `⌨️ Pressed ${key}`, Date.now() - stepStart)
            break
          }

          case 'click': {
            let selector = resolveVars(step.config.click?.selector || '', variables)
            // find_domain may have set a dynamic selector
            // For domain-based click, we use the resolved variable
            if (selector.includes('{{targetDomain}}')) {
              const domain = variables['targetDomain'] || ''
              selector = `a[href*="${domain}"]`
            }
            await page.waitForSelector(selector, { timeout: 10000 })
            await page.click(selector)
            addLog(step.id, step.label, step.type, 'success', `🖱️ Clicked ${selector}`, Date.now() - stepStart)
            break
          }

          case 'find_element': {
            const selector = resolveVars(step.config.find_element?.selector || '', variables)
            const timeout = step.config.find_element?.timeout || 5000
            await page.waitForSelector(selector, { timeout })
            addLog(step.id, step.label, step.type, 'success', `🔍 Found element ${selector}`, Date.now() - stepStart)
            break
          }

          case 'find_text': {
            const text = resolveVars(step.config.find_text?.text || '', variables)
            const timeout = step.config.find_text?.timeout || 5000
            await page.waitForFunction((t: string) => document.body.innerText.includes(t), text, { timeout })
            addLog(step.id, step.label, step.type, 'success', `🔍 Found text "${text}"`, Date.now() - stepStart)
            break
          }

          case 'find_domain': {
            const domain = resolveVars(step.config.find_domain?.domain || '', variables)
            const timeout = step.config.find_domain?.timeout || 10000
            const deadline = Date.now() + timeout
            let found = false
            while (Date.now() < deadline) {
              const links = await page.$$eval('a', (els, d: string) => els.map(el => (el as HTMLAnchorElement).href).filter(h => h.includes(d)), domain)
              if (links.length > 0) {
                addLog(step.id, step.label, step.type, 'success', `🔗 Found ${links.length} link(s) containing "${domain}"`, Date.now() - stepStart)
                found = true
                break
              }
              await page.waitForTimeout(500)
            }
            if (!found) throw new Error(`No link containing "${domain}" found within ${timeout}ms`)
            break
          }

          case 'scroll': {
            const dir = step.config.scroll?.direction || 'down'
            const amount = step.config.scroll?.amount || 500
            if (dir === 'to' && step.config.scroll?.selector) {
              await page.waitForSelector(step.config.scroll.selector, { timeout: 5000 })
              await page.evaluate((sel: string) => document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' }), step.config.scroll.selector)
            } else {
              const delta = dir === 'up' ? -amount : amount
              await page.evaluate((d: number) => window.scrollBy(0, d), delta)
            }
            addLog(step.id, step.label, step.type, 'success', `📜 Scrolled ${dir} ${amount}px`, Date.now() - stepStart)
            break
          }

          case 'screenshot': {
            const ssPath = step.config.screenshot?.path || path.join(app.getPath('temp'), `autotraffic-screenshot-${Date.now()}.png`)
            await page.screenshot({ path: ssPath, fullPage: true })
            addLog(step.id, step.label, step.type, 'success', `📸 Screenshot saved`, Date.now() - stepStart)
            break
          }

          case 'back': {
            await page.goBack({ waitUntil: 'domcontentloaded' })
            addLog(step.id, step.label, step.type, 'success', `◀️ Navigated back`, Date.now() - stepStart)
            break
          }

          case 'forward': {
            await page.goForward({ waitUntil: 'domcontentloaded' })
            addLog(step.id, step.label, step.type, 'success', `▶️ Navigated forward`, Date.now() - stepStart)
            break
          }

          case 'close_browser': {
            if (context) { await context.close(); context = null }
            addLog(step.id, step.label, step.type, 'success', `🛑 Browser closed`, Date.now() - stepStart)
            break
          }

          default:
            addLog(step.id, step.label, step.type, 'warning', `⚠️ Unknown step type: ${step.type}`, 0)
        }
      } catch (err: any) {
        addLog(step.id, step.label, step.type, 'error', `❌ ${err.message || 'Unknown error'}`, Date.now() - stepStart)
        // Don't stop on error, continue to next step
      }
    }

    // Cleanup if browser still open
    if (context) { try { await context.close() } catch {} }

    return { success: true, logs, totalDurationMs: Date.now() - startTime }

  } catch (err: any) {
    if (context) { try { await context.close() } catch {} }
    return { success: false, logs, totalDurationMs: Date.now() - startTime, error: err.message }
  }
}