import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { UpdateBanner } from './components/UpdateBanner'
import { AppShell } from './components/layout/AppShell'
import { Logo } from './components/layout/AppShell'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { Login } from './screens/Login'
import { RoleSetup } from './screens/RoleSetup'
import { Settings } from './screens/Settings'

import { Player1Home } from './screens/player1/Home'
import { CrochetSection } from './screens/player1/CrochetSection'
import { ReadyToCraft } from './screens/player1/ReadyToCraft'
import { YarnStash } from './screens/player1/YarnStash'
import { BowlingSection } from './screens/player1/BowlingSection'
import { BowlingSessions } from './screens/player1/BowlingSessions'
import { BowlingCalendar } from './screens/player1/BowlingCalendar'
import { Arsenal } from './screens/player1/Arsenal'
import { Alley } from './screens/Alley'
import { Manual } from './screens/Manual'
import { Projects } from './screens/player1/Projects'
import { FocusMode } from './screens/player1/FocusMode'

import { AnchorHome } from './screens/player2/AnchorHome'
import { QuestGenerator } from './screens/player2/QuestGenerator'
import { SupplyDrop } from './screens/player2/SupplyDrop'
import { BowlingWatch } from './screens/player2/BowlingWatch'

import { HallOfFame } from './screens/HallOfFame'

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <span className="animate-pulse-ring rounded-xl">
          <Logo size={44} />
        </span>
        <p className="text-sm font-semibold text-faint">Anchorchet</p>
      </div>
    </div>
  )
}

function Gate() {
  const { user, profile, loading } = useAuth()

  if (loading) return <Splash />
  if (!user) return <Login />
  // Signed in but no profile document yet (fresh sign-up, or a Firestore doc
  // that never got written) — collect name + role before entering the app.
  if (!profile?.role) return <RoleSetup />

  return profile.role === 'player2' ? <Player2Routes /> : <Player1Routes />
}

function Player1Routes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Player1Home />} />

        <Route path="crochet" element={<CrochetSection />}>
          <Route index element={<Navigate to="projects" replace />} />
          <Route path="projects" element={<Projects />} />
          <Route path="craft" element={<ReadyToCraft />} />
          <Route path="manual" element={<Manual />} />
          <Route path="stash" element={<YarnStash />} />
          {/* Folded into the two tabs above. Kept as redirects so his "Send a
              quest" link and any bookmark still land somewhere real. */}
          <Route path="quests" element={<Navigate to="/crochet/projects" replace />} />
          <Route path="wishlist" element={<Navigate to="/crochet/stash" replace />} />
        </Route>

        <Route path="bowling" element={<BowlingSection />}>
          <Route index element={<Navigate to="sessions" replace />} />
          <Route path="sessions" element={<BowlingSessions />} />
          <Route path="arsenal" element={<Arsenal />} />
          <Route path="calendar" element={<BowlingCalendar />} />
          <Route path="alley" element={<Alley />} />
        </Route>

        <Route path="fame" element={<HallOfFame />} />
        <Route path="focus" element={<FocusMode />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

function Player2Routes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<AnchorHome />} />
        <Route path="quests" element={<QuestGenerator />} />
        <Route path="supply" element={<SupplyDrop />} />
        <Route path="bowling" element={<BowlingWatch />} />
        {/* Not in his tab bar — reached from the Drop Tutorial card so he can
            see what he has already sent her. */}
        <Route path="manual" element={<Manual />} />
        <Route path="fame" element={<HallOfFame />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Outside the auth gate so the update prompt still reaches the login
          screen and the splash. */}
      <UpdateBanner />
      <AuthProvider>
        <DataProvider>
          <Gate />
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
