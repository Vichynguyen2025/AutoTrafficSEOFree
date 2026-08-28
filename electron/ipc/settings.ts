import { ipcMain } from 'electron'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export function registerSettingsIPC() {
  ipcMain.handle('settings:get', async () => {
    let s = await prisma.settings.findUnique({ where: { id: 'default' } })
    if (!s) {
      s = await prisma.settings.create({
        data: { id: 'default', data: JSON.stringify({ headless: false }) },
      })
    }
    try { return JSON.parse(s.data) } catch { return { headless: false } }
  })

  ipcMain.handle('settings:update', async (_e, data: any) => {
    await prisma.settings.upsert({
      where: { id: 'default' },
      create: { id: 'default', data: JSON.stringify(data) },
      update: { data: JSON.stringify(data) },
    })
    return { ok: true }
  })
}