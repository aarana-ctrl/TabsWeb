import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useApp } from './context/AppContext'
import { AppLayout } from './components/layout/AppLayout'
import AuthView from './views/AuthView'
import HomeView from './views/HomeView'
import TableDetailView from './views/TableDetailView'
import AnalyticsView from './views/AnalyticsView'
import SettingsView from './views/SettingsView'
import PlayerDetailView from './views/PlayerDetailView'
import { LoadingOverlay } from './components/ui/Misc'

export default function App() {
  const app = useApp()

  if (app.authLoading) return <LoadingOverlay />

  if (!app.isLoggedIn) return <AuthView />

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/tables/:tableId" element={<TableDetailView />} />
          <Route path="/tables/:tableId/players/:playerId" element={<PlayerDetailView />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </AppLayout>
  )
}
