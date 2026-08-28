import { PrismaClient } from '@prisma/client'
import path from 'path'
import { app } from 'electron'

let prisma: PrismaClient | null = null

export function getPrisma(): PrismaClient {
  if (prisma) return prisma

  if (app.isPackaged) {
    // In packaged app, ensure Prisma can find the library engine
    // The library engine type doesn't need a native binary (.dll/.so)
    // It uses WASM which is bundled with @prisma/client
    process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library'
  }

  prisma = new PrismaClient({
    log: ['error'],
  })

  return prisma
}