import { ipcMain } from 'electron'
import { PrismaClient } from '@prisma/client'
import { runScenario } from '../scenario-engine'
import type { ScenarioStep, RunLog } from './types'

const prisma = new PrismaClient()

export function registerScenarioIPC() {
  // CRUD
  ipcMain.handle('scenario:getAll', async () => {
    return prisma.scenario.findMany({ orderBy: { createdAt: 'desc' } })
  })

  ipcMain.handle('scenario:get', async (_e, id: string) => {
    return prisma.scenario.findUnique({ where: { id } })
  })

  ipcMain.handle('scenario:create', async (_e, data: { name: string; description: string; steps: ScenarioStep[] }) => {
    return prisma.scenario.create({
      data: {
        name: data.name,
        description: data.description || null,
        steps: JSON.stringify(data.steps || []),
      },
    })
  })

  ipcMain.handle('scenario:update', async (_e, id: string, data: { name: string; description: string; steps: ScenarioStep[] }) => {
    return prisma.scenario.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? undefined,
        steps: JSON.stringify(data.steps || []),
      },
    })
  })

  ipcMain.handle('scenario:delete', async (_e, id: string) => {
    return prisma.scenario.delete({ where: { id } })
  })

  // Run scenario
  ipcMain.handle('scenario:run', async (_e, opts: {
    profileId: string
    steps: ScenarioStep[]
    variables: Record<string, string>
  }) => {
    const logs: RunLog[] = []

    const result = await runScenario(
      opts.profileId,
      opts.steps,
      opts.variables,
      (log) => { logs.push(log) }
    )

    // Save logs to DB if a scenario is linked
    return { ...result, logs }
  })
}