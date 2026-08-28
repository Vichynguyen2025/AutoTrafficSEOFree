export {} // ensure this is a module

declare global {
  interface Window {
    electronAPI: {
      // Profile
      getProfiles: () => Promise<any[]>
      getProfile: (id: string) => Promise<any>
      createProfile: (data: any) => Promise<any>
      updateProfile: (id: string, data: any) => Promise<any>
      deleteProfile: (id: string) => Promise<any>
      cloneProfiles: (ids: string[]) => Promise<any[]>

      // Browser
      openBrowser: (profileId: string) => Promise<any>
      closeBrowser: (profileId: string) => Promise<any>
      getBrowserStatus: (profileId: string) => Promise<{ running: boolean }>

      // Proxy
      getProxies: () => Promise<any[]>
      createProxy: (data: any) => Promise<any>
      updateProxy: (id: string, data: any) => Promise<any>
      deleteProxy: (id: string) => Promise<any>
      testProxy: (id: string) => Promise<any>
      importProxies: (data: string) => Promise<any[]>

      // Scenario
      getScenarios: () => Promise<any[]>
      getScenario: (id: string) => Promise<any>
      createScenario: (data: any) => Promise<any>
      updateScenario: (id: string, data: any) => Promise<any>
      deleteScenario: (id: string) => Promise<any>
      runScenario: (opts: { profileId: string; steps: any[]; variables: Record<string, string>; headless?: boolean }) => Promise<any>

      // Campaign
      getCampaigns: () => Promise<any[]>
      getCampaign: (id: string) => Promise<any>
      createCampaign: (data: { name: string; scenarioId: string; profileIds: string[]; variables: Record<string, string>; concurrency: number; headless: boolean; scheduleAt?: string | null }) => Promise<any>
      updateCampaign: (id: string, data: any) => Promise<any>
      deleteCampaign: (id: string) => Promise<any>
      startCampaign: (id: string) => Promise<any>
      stopCampaign: (id: string) => Promise<any>
      pauseCampaign: (id: string) => Promise<any>
      resumeCampaign: (id: string) => Promise<any>
      getCampaignStats: (id: string) => Promise<{ total: number; pending: number; running: number; completed: number; failed: number; cancelled: number; active: number; isRunning: boolean; isPaused: boolean; logs: any[] }>
      getGlobalStats: () => Promise<{ total: number; running: number; pending: number; completed: number; failed: number; cancelled: number }>

      // Settings
      getSettings: () => Promise<{ headless: boolean }>
      updateSettings: (data: any) => Promise<any>
    }
  }
}