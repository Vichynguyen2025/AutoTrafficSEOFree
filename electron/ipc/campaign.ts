import { ipcMain } from 'electron'
import { PrismaClient } from '@prisma/client'
import * as TaskQueue from '../task-queue'

const prisma = new PrismaClient()

export function registerCampaignIPC() {
  // CRUD
  ipcMain.handle('campaign:getAll', async () => {
    return prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { scenario: { select: { id: true, name: true, steps: true } }, _count: { select: { tasks: true } } },
    })
  })

  ipcMain.handle('campaign:get', async (_e, id: string) => {
    const c = await prisma.campaign.findUnique({
      where: { id },
      include: { scenario: true, tasks: { include: { profile: { select: { id: true, name: true } }, logs: { orderBy: { createdAt: 'asc' }, take: 100 } }, orderBy: { createdAt: 'asc' } } },
    })
    if (!c) return null
    const status = TaskQueue.getRunningStatus(id)
    return { ...c, ...status }
  })

  ipcMain.handle('campaign:create', async (_e, data: {
    name: string; scenarioId: string; profileIds: string[]
    variables: Record<string, string>; concurrency: number; headless: boolean
    scheduleAt?: string | null
  }) => {
    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        scenarioId: data.scenarioId,
        variables: JSON.stringify(data.variables || {}),
        concurrency: data.concurrency || 1,
        status: 'draft',
      },
    })
    // Create tasks for each profile
    for (const pid of data.profileIds) {
      await prisma.task.create({
        data: {
          campaignId: campaign.id,
          profileId: pid,
          status: 'pending',
          variables: JSON.stringify(data.variables || {}),
        },
      })
    }
    return campaign
  })

  ipcMain.handle('campaign:update', async (_e, id: string, data: any) => {
    return prisma.campaign.update({ where: { id }, data })
  })

  ipcMain.handle('campaign:delete', async (_e, id: string) => {
    await prisma.taskLog.deleteMany({ where: { task: { campaignId: id } } })
    await prisma.task.deleteMany({ where: { campaignId: id } })
    return prisma.campaign.delete({ where: { id } })
  })

  // Control
  ipcMain.handle('campaign:start', async (_e, id: string) => {
    return TaskQueue.startCampaign(id)
  })

  ipcMain.handle('campaign:stop', async (_e, id: string) => {
    return TaskQueue.stopCampaign(id)
  })

  ipcMain.handle('campaign:pause', async (_e, id: string) => {
    return TaskQueue.pauseCampaign(id)
  })

  ipcMain.handle('campaign:resume', async (_e, id: string) => {
    return TaskQueue.resumeCampaign(id)
  })

  // Stats
  ipcMain.handle('campaign:stats', async (_e, id: string) => {
    return TaskQueue.getCampaignStats(id)
  })

  ipcMain.handle('campaign:globalStats', async () => {
    return TaskQueue.getGlobalStats()
  })
}