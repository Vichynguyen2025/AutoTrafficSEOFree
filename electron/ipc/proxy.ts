import { ipcMain } from 'electron'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export function registerProxyIPC() {
  ipcMain.handle('proxy:getAll', async () => {
    return prisma.proxy.findMany({ orderBy: { createdAt: 'desc' } })
  })

  ipcMain.handle('proxy:create', async (_e, data: any) => {
    return prisma.proxy.create({ data })
  })

  ipcMain.handle('proxy:update', async (_e, id: string, data: any) => {
    return prisma.proxy.update({ where: { id }, data })
  })

  ipcMain.handle('proxy:delete', async (_e, id: string) => {
    await prisma.profile.updateMany({ where: { proxyId: id }, data: { proxyId: null } })
    return prisma.proxy.delete({ where: { id } })
  })

  ipcMain.handle('proxy:test', async (_e, id: string) => {
    const proxy = await prisma.proxy.findUnique({ where: { id } })
    if (!proxy) throw new Error('Proxy not found')
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const url = proxy.type === 'socks5' ? `socks5://${proxy.host}:${proxy.port}` : `http://${proxy.host}:${proxy.port}`
      const response = await fetch('http://httpbin.org/ip', {
        signal: controller.signal,
        ...(proxy.type !== 'socks5' ? { proxy: url } : {}),
      })
      clearTimeout(timeout)
      if (response.ok) {
        await prisma.proxy.update({ where: { id }, data: { status: 'ok' } })
        return { ok: true, status: 'ok' }
      }
      throw new Error('Response not ok')
    } catch {
      await prisma.proxy.update({ where: { id }, data: { status: 'error' } })
      return { ok: false, status: 'error' }
    }
  })

  ipcMain.handle('proxy:import', async (_e, raw: string) => {
    const lines = raw.trim().split('\n').filter(Boolean)
    const results = []
    for (const line of lines) {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const data: any = { host: parts[0], port: parseInt(parts[1]), type: 'http' }
        if (parts.length >= 4) {
          data.username = parts[2]
          data.password = parts[3]
        }
        try {
          const created = await prisma.proxy.create({ data })
          results.push(created)
        } catch { /* skip duplicate */ }
      }
    }
    return results
  })
}