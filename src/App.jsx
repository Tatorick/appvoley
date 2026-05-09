import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Auth/Login'
import RegisterClub from './pages/Auth/RegisterClub'
import JoinClub from './pages/Auth/JoinClub'
import AssistantRegister from './pages/Auth/AssistantRegister'
import ForgotPassword from './pages/Auth/ForgotPassword'
import ResetPassword from './pages/Auth/ResetPassword'
import SetupClub from './pages/Auth/SetupClub'
import DashboardLayout from './components/DashboardLayout'
import ClubHome from './pages/Dashboard/ClubHome'
import Teams from './pages/Dashboard/Teams'
import Players from './pages/Dashboard/Players'
import PlayerDetails from './pages/Dashboard/PlayerDetails'
import Settings from './pages/Dashboard/Settings'
import Matchmaking from './pages/Dashboard/Matchmaking'
import MatchmakingChat from './pages/Dashboard/MatchmakingChat'
import Agenda from './pages/Dashboard/Agenda'
import Attendance from './pages/Dashboard/Attendance'
import Statistics from './pages/Dashboard/Statistics'
import Payments from './pages/Dashboard/Payments'
import Tournaments from './pages/Dashboard/Tournaments'
import TournamentDetails from './pages/Dashboard/TournamentDetails'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ClubProvider } from './context/ClubContext'
import PortalLogin from './pages/Portal/PortalLogin'
import PortalDashboard from './pages/Portal/PortalDashboard'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/Admin/AdminDashboard'
import ClubInspector from './pages/Admin/ClubInspector'
import { Loader2 } from 'lucide-react'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
    if (!user) return <Navigate to="/auth" replace />

    return children
}

// Auth Route Wrapper (Redirects if already logged in)
const AuthRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>
    if (user) return <Navigate to="/app" replace />

    return children
}

function AuthHandler() {
    const [searchParams] = useSearchParams()
    const mode = searchParams.get('mode')

    if (mode === 'register') {
        return <RegisterClub />
    }
    return <Login />
}



function App() {
    return (
        <Router>
            <AuthProvider>
            <ClubProvider>
                <Routes>
                    {/* Public Website */}
                    <Route path="/" element={<Landing />} />

                    {/* Public Player Portal */}
                    <Route path="/portal" element={<PortalLogin />} />
                    <Route path="/portal/dashboard" element={<PortalDashboard />} />

                    {/* Auth Routes */}
                    <Route path="/auth" element={
                        <AuthRoute>
                            <AuthHandler />
                        </AuthRoute>
                    } />

                    <Route path="/register-club" element={
                        <AuthRoute>
                            <RegisterClub />
                        </AuthRoute>
                    } />

                    {/* Password recovery routes — public, no auth required */}
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Post-Google-OAuth club setup — must be public (user is auth'd but has no club yet) */}
                    <Route path="/setup-club" element={<SetupClub />} />

                    {/* New /join route - Accessible by both guest and auth */}
                    <Route path="/join" element={<JoinClub />} />

                    {/* Assistant Coach registration via club code */}
                    <Route path="/assistant-register" element={<AssistantRegister />} />

                    {/* Super Admin Routes */}
                    <Route path="/admin" element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<AdminDashboard />} />
                        <Route path="club/:id" element={<ClubInspector />} />
                    </Route>

                    {/* Protected Routes (Dashboard) */}
                    <Route path="/app" element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<ClubHome />} />
                        <Route path="teams" element={<Teams />} />
                        <Route path="players" element={<Players />} />
                        <Route path="players/:id" element={<PlayerDetails />} />
                        <Route path="payments" element={<Payments />} />
                        <Route path="matchmaking" element={<Matchmaking />} />
                        <Route path="matchmaking/chat/:requestId" element={<MatchmakingChat />} />
                        <Route path="agenda" element={<Agenda />} />
                        <Route path="attendance" element={<Attendance />} />
                        <Route path="tournaments" element={<Tournaments />} />
                        <Route path="tournaments/:id" element={<TournamentDetails />} />
                        <Route path="statistics" element={<Statistics />} />
                        <Route path="settings" element={<Settings />} />
                        {/* Add other routes here */}
                    </Route>

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </ClubProvider>
            </AuthProvider>
        </Router>
    )
}

export default App
