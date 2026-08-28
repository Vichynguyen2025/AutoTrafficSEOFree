import { PrismaClient } from '@prisma/client'
import path from 'path'
import { app } from 'electron'

let prisma: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (prisma) return prisma

  // Handle path resolution for packaged Electron app
  if (app.isPackaged) {
    // In packaged app, Prisma engine binaries are in extraResources
    const resourcesPath = process.resourcesPath
    const enginePath = path.join(resourcesPath, 'prisma-client')
    
    // Try windows DLL first
    const dllPath = path.join(enginePath, 'query_engine-windows.dll.node')
    const fs = require('fs')
    if (fs.existsSync(dllPath)) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = dllPath
    }
  }

  prisma = new PrismaClient({
    log: ['error'],
  })

  return prisma
}