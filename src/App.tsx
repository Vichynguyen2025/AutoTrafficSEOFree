import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Profiles from './pages/Profiles'
import Proxies from './pages/Proxies'
import Scenarios from './pages/Scenarios'
import ScenarioEditor from './pages/ScenarioEditor'
import ScenarioRun from './pages/ScenarioRun'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import Tasks from './pages/Tasks'
import Logs from './pages/Logs'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profiles" element={<Profiles />} />
        <Route path="/proxies" element={<Proxies />} />
        <Route path="/scenarios" element={<Scenarios />} />
        <Route path="/scenarios/new" element={<ScenarioEditor />} />
        <Route path="/scenarios/:id" element={<ScenarioEditor />} />
        <Route path="/scenarios/:id/run" element={<ScenarioRun />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}