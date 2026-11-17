// src/components/layout/TopBar.jsx
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

const PAGE_TITLES = {
  '/':               { title: 'Induction Control Panel',      sub: 'Nightly fleet induction decision system' },
  '/depot':          { title: 'Depot Layout',                 sub: 'Visual track and stabling geometry' },
  '/cleaning':       { title: 'Cleaning Management',          sub: 'Hygiene schedule and bay status' },
  '/branding':       { title: 'Branding Exposure',            sub: 'Advertiser contract KPI tracking' },
  '/alerts':         { title: 'Alerts & Fleet Health',        sub: 'Live system health and risk monitoring' },
  '/history':        { title: 'Induction History',            sub: 'Decision audit trail and logs' },
  '/resources':      { title: 'Resource Utilisation',         sub: 'Bay, track and shunting metrics' },
  '/explainability': { title: 'Decision Explainability',      sub: 'Per-train scoring factor analysis' },
}

export default function TopBar() {
  const { pathname } = useLocation()
  const { theme, toggle } = useTheme()
  const [time, setTime] = useState(new Date())
  const { user, logout } = useAuth()

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const info = PAGE_TITLES[pathname] || { title: 'KMRL DSS', sub: '' }

  const pad = (n) => String(n).padStart(2, '0')
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`
  const dateStr = time.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <header
      className="fixed top-0 left-64 right-0 h-14 flex items-center justify-between px-6 z-30 transition-colors duration-200"
      style={{
        background: 'var(--depot-panel)',
        borderBottom: '1px solid var(--depot-border)',
      }}
    >
      {/* Left: page title */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className={`font-display font-bold leading-tight tracking-wide ${pathname === '/' ? 'text-2xl' : 'text-lg'}`}
            style={{ color: 'var(--depot-white)' }}>
            {info.title}
          </h1>
          <p className="font-display text-xs tracking-wide"
            style={{ color: 'var(--depot-muted)' }}>
            {info.sub}
          </p>
        </div>
      </div>

      {/* Right: status + user + theme toggle + clock */}
<div className="flex items-center gap-5">

  {/* User Info */}
  <div
    className="flex items-center gap-3 px-4 py-2 rounded-lg border shadow-sm"
    style={{
      borderColor: 'var(--depot-border)',
      background: 'var(--depot-card)',
    }}
  >
    <div>
      <div
        className="font-display text-sm font-semibold tracking-wide"
        style={{ color: 'var(--depot-white)' }}
      >
        {user?.id}
      </div>

      <div
        className="text-[11px] uppercase tracking-wider"
        style={{ color: 'var(--depot-muted)' }}
      >
        {user?.role}
      </div>
    </div>

    <button
      onClick={logout}
      className="rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-red-500/10"
      style={{ borderColor: 'rgba(255,23,68,0.45)', color: '#ff5b70' }}
    >
      Logout
    </button>
  </div>

  {/* Theme Toggle */}
  <button
    onClick={toggle}
    title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
    className="flex items-center justify-center w-8 h-8 rounded-sm border transition-all duration-200 hover:scale-110"
    style={{
      borderColor: 'var(--depot-border)',
      background: 'var(--depot-dim)',
      color: theme === 'dark' ? '#ffd740' : '#0284c7',
    }}
  >
    {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
  </button>

  {/* Clock */}
  <div className="text-right">
    <div
      className="font-mono text-sm font-bold glow-accent"
      style={{ color: 'var(--depot-accent)' }}
    >
      {timeStr}
    </div>

    <div
      className="font-mono text-2xs"
      style={{ color: 'var(--depot-muted)' }}
    >
      {dateStr}
    </div>
  </div>
</div>
    </header>
  )
}