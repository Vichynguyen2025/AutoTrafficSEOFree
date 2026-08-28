import { ipcMain } from 'electron'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export function registerProfileIPC() {
  ipcMain.handle('profile:getAll', async () => {
    return prisma.profile.findMany({ include: { proxy: true }, orderBy: { createdAt: 'desc' } })
  })

  ipcMain.handle('profile:get', async (_e, id: string) => {
    return prisma.profile.findUnique({ where: { id }, include: { proxy: true } })
  })

  ipcMain.handle('profile:create', async (_e, data: any) => {
    return prisma.profile.create({ data })
  })

  ipcMain.handle('profile:update', async (_e, id: string, data: any) => {
    return prisma.profile.update({ where: { id }, data })
  })

  ipcMain.handle('profile:delete', async (_e, id: string) => {
    await prisma.taskLog.deleteMany({ where: { task: { profileId: id } } })
    await prisma.task.deleteMany({ where: { profileId: id } })
    return prisma.profile.delete({ where: { id } })
  })

  ipcMain.handle('profile:clone', async (_e, ids: string[]) => {
    const results = []
    for (const id of ids) {
      const original = await prisma.profile.findUnique({ where: { id } })
      if (!original) continue
      const clone = await prisma.profile.create({
        data: {
          name: `${original.name} (Copy)`,
          userDataDir: original.userDataDir ? `${original.userDataDir}-copy` : null,
          proxyId: original.proxyId,
          note: original.note,
        },
      })
      results.push(clone)
    }
    return results
  })
}