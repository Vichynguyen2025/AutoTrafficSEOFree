import { getPrisma } from '../prisma'
import { chromium, BrowserContext, Page } from 'playwright'
import path from 'path'
import { app } from 'electron'


const prisma = getPrisma()
// ====== Task Queue State ======
interface QueuedTask {
  taskId: string
  campaignId: string
  profileId: string
  variables: Record<string, string>
  headless: boolean
  steps: any[]
  context: BrowserContext | null
  page: Page | null
  abort: boolean
}

interface CampaignControl {
  running: Set<string>
  paused: boolean
  timer: NodeJS.Timeout | undefined
}

const activeCampaigns = new Map<string, CampaignControl>()
const runningTasks = new Map<string, QueuedTask>()
const browserInUse = new Set<string>()

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

// ====== Public API ======

export function getRunningStatus(campaignId: string) {
  const c = activeCampaigns.get(campaignId)
  if (!c) return { running: false, paused: false, activeCount: 0 }
  return { running: true, paused: c.paused, activeCount: c.running.size }
}

export function isProfileBusy(profileId: string) {
  return browserInUse.has(profileId)
}

export async function startCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { scenario: true, tasks: true },
  })
  if (!campaign) throw new Error('Campaign not found')

  // Reset tasks to pending
  await prisma.task.updateMany({ where: { campaignId }, data: { status: 'pending' } })
  const tasks = await prisma.task.findMany({ where: { campaignId, status: 'pending' }, orderBy: { createdAt: 'asc' } })

  if (activeCampaigns.has(campaignId)) {
    throw new Error('Campaign is already running')
  }

  const concurrency = campaign.concurrency || 1
  const ctrl = { running: new Set<string>(), paused: false, timer: null as any }
  activeCampaigns.set(campaignId, ctrl)

  // Launch initial batch
  const toLaunch = tasks.slice(0, concurrency)
  for (const t of toLaunch) {
    launchTask(campaignId, t.id, campaign, ctrl)
  }

  return { ok: true }
}

export async function stopCampaign(campaignId: string) {
  const ctrl = activeCampaigns.get(campaignId)
  if (!ctrl) return { ok: true }

  // Abort all running
  for (const taskId of ctrl.running) {
    const qt = runningTasks.get(taskId)
    if (qt) {
      qt.abort = true
      try { if (qt.context) await qt.context.close() } catch {}
    }
  }

  clearInterval(ctrl.timer!)
  activeCampaigns.delete(campaignId)

  // Mark cancelled remaining
  await prisma.task.updateMany({
    where: { campaignId, status: { in: ['pending', 'running'] } },
    data: { status: 'cancelled' },
  })

  return { ok: true }
}

export async function pauseCampaign(campaignId: string) {
  const ctrl = activeCampaigns.get(campaignId)
  if (!ctrl) throw new Error('Campaign not running')
  ctrl.paused = true
  return { ok: true }
}

export async function resumeCampaign(campaignId: string) {
  const ctrl = activeCampaigns.get(campaignId)
  if (!ctrl) throw new Error('Campaign not running')
  ctrl.paused = false

  // Launch pending tasks up to concurrency
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { scenario: true },
  })
  if (!campaign) return { ok: true }

  const pendingTasks = await prisma.task.findMany({
    where: { campaignId, status: 'pending' },
    orderBy: { createdAt: 'asc' },
  })

  const concurrency = campaign.concurrency || 1
  const slots = concurrency - ctrl.running.size
  for (const t of pendingTasks.slice(0, slots)) {
    launchTask(campaignId, t.id, campaign, ctrl)
  }

  return { ok: true }
}

// ====== Internal ======

async function launchTask(
  campaignId: string,
  taskId: string,
  campaign: any,
  ctrl: CampaignControl
) {
  if (ctrl.paused || ctrl.running.size >= (campaign.concurrency || 1)) return

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { profile: { include: { proxy: true } } },
  })
  if (!task || task.status !== 'pending') return

  const profile = task.profile
  if (browserInUse.has(profile.id)) {
    // Profile busy, leave as pending, will be picked up later
    return
  }

  ctrl.running.add(taskId)
  await prisma.task.update({ where: { id: taskId }, data: { status: 'running' } })

  // Parse variables
  let vars: Record<string, string> = {}
  try { vars = { ...JSON.parse(campaign.variables || '{}'), ...JSON.parse(task.variables || '{}') } } catch {}

  let steps: any[] = []
  try { steps = JSON.parse(campaign.scenario.steps || '[]') } catch {}

  const headless = campaign.concurrency > 1 ? true : false // force headless for concurrency > 1

  // Execute in background
  executeTask(taskId, campaignId, profile, steps, vars, headless, ctrl)
}

async function executeTask(
  taskId: string,
  campaignId: string,
  profile: any,
  steps: any[],
  variables: Record<string, string>,
  headless: boolean,
  ctrl: CampaignControl
) {
  browserInUse.add(profile.id)
  const startTime = Date.now()
  let context: BrowserContext | null = null
  let page: Page | null = null
  let failed = false

  try {
    const userDataDir = profile.userDataDir || path.join(app.getPath('userData'), 'profiles', profile.id)
    const launchOptions: any = { headless, userDataDir }

    if (profile.proxy) {
      launchOptions.proxy = {
        server: `${profile.proxy.type}://${profile.proxy.host}:${profile.proxy.port}`,
        username: profile.proxy.username || undefined,
        password: profile.proxy.password || undefined,
      }
    }

    context = await chromium.launchPersistentContext(userDataDir, launchOptions)
    page = context.pages()[0] || await context.newPage()

    const qt: QueuedTask = { taskId, campaignId, profileId: profile.id, variables, headless, steps, context, page, abort: false }
    runningTasks.set(taskId, qt)

    for (const step of steps) {
      if (qt.abort) {
        await addLog(taskId, 'info', `⏹️ Task cancelled during step: ${step.label || step.type}`)
        break
      }
      if (ctrl.paused) {
        await addLog(taskId, 'info', `⏸️ Paused at step: ${step.label || step.type}`)
        break
      }

      try {
        await executeStep(page, step, variables)
        await addLog(taskId, 'success', `✅ ${step.label || step.type}`)
      } catch (err: any) {
        await addLog(taskId, 'error', `❌ ${step.label || step.type}: ${err.message}`)
        failed = true
      }
    }

    if (context) { try { await context.close() } catch {} }
  } catch (err: any) {
    await addLog(taskId, 'error', `❌ Fatal: ${err.message}`)
    failed = true
    if (context) { try { await context.close() } catch {} }
  }

  // Cleanup
  runningTasks.delete(taskId)
  browserInUse.delete(profile.id)
  ctrl.running.delete(taskId)

  const duration = Date.now() - startTime
  const status = failed ? 'failed' : 'completed'
  await prisma.task.update({
    where: { id: taskId },
    data: { status, retryCount: failed ? { increment: 1 } : undefined },
  })

  // Launch next pending task
  if (!ctrl.paused && !ctrl.running.has(taskId)) {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { scenario: true },
    })
    if (campaign) {
      const pendingTasks = await prisma.task.findMany({
        where: { campaignId, status: 'pending' },
        orderBy: { createdAt: 'asc' },
      })
      const concurrency = campaign.concurrency || 1
      const slots = concurrency - ctrl.running.size
      for (const t of pendingTasks.slice(0, slots)) {
        launchTask(campaignId, t.id, campaign, ctrl)
      }
    }
  }

  // Check if all done
  const remaining = await prisma.task.count({
    where: { campaignId, status: { in: ['pending', 'running'] } },
  })
  if (remaining === 0) {
    clearInterval(ctrl.timer!)
    activeCampaigns.delete(campaignId)
  }
}

// ====== Step Execution ======

function resolveVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_m, key) => vars[key] || '')
}

async function executeStep(page: Page, step: any, variables: Record<string, string>) {
  const config = step.config || {}
  switch (step.type) {
    case 'open_url': {
      const url = resolveVars(config.open_url?.url || '', variables)
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      break
    }
    case 'wait': {
      const ms = config.wait?.ms || 2000
      await page.waitForTimeout(ms)
      break
    }
    case 'type_text': {
      const selector = resolveVars(config.type_text?.selector || '', variables)
      const text = resolveVars(config.type_text?.text || '', variables)
      await page.waitForSelector(selector, { timeout: 10000 })
      await page.fill(selector, '')
      await page.type(selector, text, { delay: 30 })
      break
    }
    case 'press_key': {
      await page.keyboard.press(config.press_key?.key || 'Enter')
      break
    }
    case 'click': {
      let selector = resolveVars(config.click?.selector || '', variables)
      if (selector.includes('{{targetDomain}}')) {
        selector = `a[href*="${variables['targetDomain'] || ''}"]`
      }
      await page.waitForSelector(selector, { timeout: 10000 })
      await page.click(selector)
      break
    }
    case 'find_element': {
      const selector = resolveVars(config.find_element?.selector || '', variables)
      await page.waitForSelector(selector, { timeout: config.find_element?.timeout || 5000 })
      break
    }
    case 'find_text': {
      const text = resolveVars(config.find_text?.text || '', variables)
      const timeout = config.find_text?.timeout || 5000
      await page.waitForFunction((t: string) => document.body.innerText.includes(t), text, { timeout })
      break
    }
    case 'find_domain': {
      const domain = resolveVars(config.find_domain?.domain || '', variables)
      const timeout = config.find_domain?.timeout || 10000
      const deadline = Date.now() + timeout
      let found = false
      while (Date.now() < deadline) {
        const links = await page.$$eval('a', (els: any, d: string) => els.map((el: any) => el.href).filter((h: string) => h.includes(d)), domain)
        if (links.length > 0) { found = true; break }
        await page.waitForTimeout(500)
      }
      if (!found) throw new Error(`No link containing "${domain}" found`)
      break
    }
    case 'scroll': {
      const dir = config.scroll?.direction || 'down'
      const amount = config.scroll?.amount || 500
      if (dir === 'to' && config.scroll?.selector) {
        await page.waitForSelector(config.scroll.selector, { timeout: 5000 })
        await page.evaluate((sel: string) => document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' }), config.scroll.selector)
      } else {
        await page.evaluate((d: number) => window.scrollBy(0, d), dir === 'up' ? -amount : amount)
      }
      break
    }
    case 'screenshot': {
      const ssPath = config.screenshot?.path || path.join(app.getPath('temp'), `autotraffic-task-${Date.now()}.png`)
      await page.screenshot({ path: ssPath, fullPage: true })
      break
    }
    case 'back': {
      await page.goBack({ waitUntil: 'domcontentloaded' })
      break
    }
    case 'forward': {
      await page.goForward({ waitUntil: 'domcontentloaded' })
      break
    }
    case 'close_browser': {
      // Handled at cleanup
      break
    }
  }
}

async function addLog(taskId: string, level: string, message: string) {
  try {
    await prisma.taskLog.create({ data: { taskId, level, message } })
  } catch {}
}

// ====== Stats ======

export async function getCampaignStats(campaignId: string) {
  const tasks = await prisma.task.findMany({ where: { campaignId } })
  const logs = await prisma.taskLog.findMany({
    where: { task: { campaignId } },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })
  const ctrl = activeCampaigns.get(campaignId)
  return {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    running: tasks.filter(t => t.status === 'running').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
    active: ctrl?.running.size || 0,
    isRunning: !!ctrl,
    isPaused: ctrl?.paused || false,
    logs,
  }
}

export async function getGlobalStats() {
  const [total, running, pending, completed, failed, cancelled] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: 'running' } }),
    prisma.task.count({ where: { status: 'pending' } }),
    prisma.task.count({ where: { status: 'completed' } }),
    prisma.task.count({ where: { status: 'failed' } }),
    prisma.task.count({ where: { status: 'cancelled' } }),
  ])
  return { total, running, pending, completed, failed, cancelled }
}