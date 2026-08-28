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
      runScenario: (opts: { profileId: string; steps: any[]; variables: Record<string, string> }) => Promise<any>

      // Settings
      getSettings: () => Promise<any>
      updateSettings: (data: any) => Promise<any>
    }
  }
}