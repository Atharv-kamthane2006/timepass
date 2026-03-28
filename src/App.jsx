import { useEffect } from "react"
import { SignedIn, SignedOut, UserButton, useAuth } from "@clerk/clerk-react"
import { Routes, Route, Navigate, NavLink, useNavigate } from "react-router-dom"
import { setTokenGetter } from "./api/api"

import UploadScreen from "./screens/UploadScreen"
import DictionaryScreen from "./screens/DictionaryScreen"
import ChatScreen from "./screens/ChatScreen"
import QualityScreen from "./screens/QualityScreen"
import Visualization3D from "./screens/Visualization3D"
import AnalysisScreen from "./screens/AnalysisScreen"
import SignInScreen from "./screens/SignInScreen"
import SignUpScreen from "./screens/SignUpScreen"
import LandingPage from "./screens/LandingPage"
import {
  BarChart2,
  BookOpen,
  GitBranch,
  MessageSquare,
  Settings,
  ShieldCheck,
  UploadCloud,
} from "lucide-react"

const SIDEBAR_ITEMS = [
  { label: "Upload", to: "/upload", icon: UploadCloud },
  { label: "Dictionary", to: "/dictionary", icon: BookOpen },
  { label: "Chat", to: "/chat", icon: MessageSquare },
  { label: "Visualization", to: "/visualization", icon: GitBranch },
  { label: "Quality", to: "/quality", icon: ShieldCheck },
  { label: "Analysis", to: "/analysis", icon: BarChart2 },
]

function SidebarNavItem({ label, to, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `group relative grid h-10 w-10 place-items-center rounded-[var(--radius-md)] transition-all duration-150 ${
          isActive
            ? "bg-[var(--accent-dim)] text-[var(--accent-bright)]"
            : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
        }`
      }
      aria-label={label}
    >
      {({ isActive }) => (
        <>
          {isActive ? (
            <span className="absolute -left-3 top-1/2 h-6 w-[2px] -translate-y-1/2 rounded-full bg-[var(--accent)]" />
          ) : null}
          <Icon className="h-[18px] w-[18px]" />
          <span className="pointer-events-none absolute left-[72px] top-1/2 z-[80] hidden -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-overlay)] px-[10px] py-1 text-xs text-[var(--text-primary)] shadow-[var(--shadow-md)] group-hover:block group-focus-within:block">
            {label}
            <span className="absolute left-[-5px] top-1/2 h-0 w-0 -translate-y-1/2 border-b-[5px] border-r-[5px] border-t-[5px] border-b-transparent border-r-[var(--bg-overlay)] border-t-transparent" />
          </span>
        </>
      )}
    </NavLink>
  )
}

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg-void)] text-[var(--text-primary)]">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center justify-between border-r border-[var(--border-default)] bg-[var(--bg-surface)] py-4">
        <div className="flex w-full flex-col items-center gap-5">
          <div className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-elevated)]">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <path d="M14 2L24 8V20L14 26L4 20V8L14 2Z" stroke="var(--accent)" strokeWidth="1.4" />
              <path d="M18.6 9.1C17.5 8.1 16.1 7.55 14 7.55C11.3 7.55 9.7 8.8 9.7 10.5C9.7 14.2 18.5 12.1 18.5 16.45C18.5 18.4 16.8 20.35 13.8 20.35C11.8 20.35 10.05 19.6 8.85 18.3" stroke="var(--accent-bright)" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>

          <nav className="flex w-full flex-col items-center gap-2">
            {SIDEBAR_ITEMS.map((item) => (
              <SidebarNavItem key={item.to} {...item} />
            ))}
          </nav>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <div className="group relative grid h-10 w-10 place-items-center rounded-[var(--radius-md)] text-[var(--text-muted)] transition-all duration-150 hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]">
            <Settings className="h-[18px] w-[18px]" />
            <span className="pointer-events-none absolute left-[72px] top-1/2 z-[80] hidden -translate-y-1/2 whitespace-nowrap rounded-[var(--radius-sm)] border border-[var(--border-strong)] bg-[var(--bg-overlay)] px-[10px] py-1 text-xs text-[var(--text-primary)] shadow-[var(--shadow-md)] group-hover:block group-focus-within:block">
              Settings
              <span className="absolute left-[-5px] top-1/2 h-0 w-0 -translate-y-1/2 border-b-[5px] border-r-[5px] border-t-[5px] border-b-transparent border-r-[var(--bg-overlay)] border-t-transparent" />
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="relative inline-flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--success)] opacity-55" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--success)]" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.08em] text-[var(--text-secondary)]">API</span>
          </div>

          <div className="mb-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-1">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-7 w-7 rounded-[8px]",
                },
              }}
            />
          </div>
        </div>
      </aside>

      <main className="ml-16 min-h-screen bg-[var(--bg-base)]">
        {children}
      </main>
    </div>
  )
}

function ProtectedRoute({ children }) {
  return (
    <>
      <SignedIn>
        <MainLayout>
          {children}
        </MainLayout>
      </SignedIn>
      <SignedOut>
        <Navigate to="/sign-in" replace />
      </SignedOut>
    </>
  )
}

export default function App() {
  const { getToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Pass the Clerk token getter to our Axios instance
    setTokenGetter(getToken)
  }, [getToken])

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/sign-in/*" element={<SignInScreen />} />
      <Route path="/sign-up/*" element={<SignUpScreen />} />

      {/* Protected UI Routes */}
      <Route path="/upload" element={<ProtectedRoute><UploadScreen onContinue={() => navigate('/dictionary')} /></ProtectedRoute>} />
      <Route path="/dictionary" element={<ProtectedRoute><DictionaryScreen /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatScreen /></ProtectedRoute>} />
      <Route path="/visualization" element={<ProtectedRoute><Visualization3D /></ProtectedRoute>} />
      <Route path="/quality" element={<ProtectedRoute><QualityScreen /></ProtectedRoute>} />
      <Route path="/analysis" element={<ProtectedRoute><AnalysisScreen /></ProtectedRoute>} />

      {/* Index Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
