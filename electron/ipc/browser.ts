import { ipcMain } from 'electron'
import { PrismaClient } from '@prisma/client'
import { chromium } from 'playwright'
import path from 'path'
import { app } from 'electron'

const prisma = new PrismaClient()
const browserInstances = new Map<string, any>()

export function registerBrowserIPC() {
  ipcMain.handle('browser:open', async (_e, profileId: string) => {
    const profile = await prisma.profile.findUnique({ where: { id: profileId }, include: { proxy: true } })
    if (!profile) throw new Error('Profile not found')

    const userDataDir = profile.userDataDir || path.join(app.getPath('userData'), 'profiles', profile.id)
    const launchOptions: any = {
      headless: false,
      userDataDir,
    }

    if (profile.proxy) {
      const p = profile.proxy
      launchOptions.proxy = {
        server: `${p.type}://${p.host}:${p.port}`,
        username: p.username || undefined,
        password: p.password || undefined,
      }
    }

    const browser = await chromium.launchPersistentContext(userDataDir, launchOptions)
    browserInstances.set(profileId, browser)

    await prisma.profile.update({ where: { id: profileId }, data: { status: 'running' } })

    browser.on('close', async () => {
      browserInstances.delete(profileId)
      await prisma.profile.update({ where: { id: profileId }, data: { status: 'idle' } })
    })

    return { ok: true, userDataDir }
  })

  ipcMain.handle('browser:close', async (_e, profileId: string) => {
    const browser = browserInstances.get(profileId)
    if (browser) {
      await browser.close()
      browserInstances.delete(profileId)
    }
    await prisma.profile.update({ where: { id: profileId }, data: { status: 'idle' } })
    return { ok: true }
  })

  ipcMain.handle('browser:status', async (_e, profileId: string) => {
    return { running: browserInstances.has(profileId) }
  })
}