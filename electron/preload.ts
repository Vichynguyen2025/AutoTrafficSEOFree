import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Profile
  getProfiles: () => ipcRenderer.invoke('profile:getAll'),
  getProfile: (id: string) => ipcRenderer.invoke('profile:get', id),
  createProfile: (data: any) => ipcRenderer.invoke('profile:create', data),
  updateProfile: (id: string, data: any) => ipcRenderer.invoke('profile:update', id, data),
  deleteProfile: (id: string) => ipcRenderer.invoke('profile:delete', id),
  cloneProfiles: (ids: string[]) => ipcRenderer.invoke('profile:clone', ids),

  // Browser
  openBrowser: (profileId: string) => ipcRenderer.invoke('browser:open', profileId),
  closeBrowser: (profileId: string) => ipcRenderer.invoke('browser:close', profileId),
  getBrowserStatus: (profileId: string) => ipcRenderer.invoke('browser:status', profileId),

  // Proxy
  getProxies: () => ipcRenderer.invoke('proxy:getAll'),
  createProxy: (data: any) => ipcRenderer.invoke('proxy:create', data),
  updateProxy: (id: string, data: any) => ipcRenderer.invoke('proxy:update', id, data),
  deleteProxy: (id: string) => ipcRenderer.invoke('proxy:delete', id),
  testProxy: (id: string) => ipcRenderer.invoke('proxy:test', id),
  importProxies: (data: string) => ipcRenderer.invoke('proxy:import', data),

  // Scenario
  getScenarios: () => ipcRenderer.invoke('scenario:getAll'),
  getScenario: (id: string) => ipcRenderer.invoke('scenario:get', id),
  createScenario: (data: any) => ipcRenderer.invoke('scenario:create', data),
  updateScenario: (id: string, data: any) => ipcRenderer.invoke('scenario:update', id, data),
  deleteScenario: (id: string) => ipcRenderer.invoke('scenario:delete', id),
  runScenario: (opts: any) => ipcRenderer.invoke('scenario:run', opts),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (data: any) => ipcRenderer.invoke('settings:update', data),
})