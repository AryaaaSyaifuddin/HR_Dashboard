import './Topbar.css'
import logo from '../assets/logo.png'

const TOGGLE_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export default function Topbar({ title, onToggleSidebar }) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-toggle" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          {TOGGLE_ICON}
        </button>
        <img src={logo} alt="Logo" className="topbar-logo" />
        <h2 className="topbar-title">HRD Dashboard</h2>
      </div>
    </header>
  )
}
