import './Sidebar.css'
import logo from '../assets/logo.png'

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  ),
  recruitment: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 18c.8-2.8 3-4.5 5.5-4.5s4.7 1.7 5.5 4.5" />
      <path d="M16 7h5M18.5 4.5v5" />
    </svg>
  ),
  manpower: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="8" r="2.6" />
      <circle cx="16" cy="8" r="2.6" />
      <path d="M3.5 18c.7-2.6 2.7-4.2 4.5-4.2S11.8 15.4 12.5 18" />
      <path d="M11.5 18c.7-2.6 2.7-4.2 4.5-4.2s3.8 1.6 4.5 4.2" />
    </svg>
  ),
  internship: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 8.5L12 4l8.5 4.5L12 13z" />
      <path d="M7 11.2V15c0 1.6 2.1 3 5 3s5-1.4 5-3v-3.8" />
    </svg>
  ),
  overtime: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3.2 2.2" />
    </svg>
  ),
  bpjs: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20s-6-3.8-6-9a4 4 0 0 1 6-3.4A4 4 0 0 1 18 11c0 5.2-6 9-6 9z" />
      <path d="M10 12h4M12 10v4" />
    </svg>
  ),
  salary: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10h17" />
      <circle cx="12" cy="14" r="1.8" />
    </svg>
  ),
  kpi: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19V9" />
      <path d="M10 19V5" />
      <path d="M15 19v-7" />
      <path d="M20 19v-4" />
    </svg>
  ),
  training: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8.5h16v9H4z" />
      <path d="M8 12h8" />
      <path d="M10 16h4" />
    </svg>
  ),
}

export default function Sidebar({ menu, activePage, onNavigate, isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>

      <div className="sidebar-logo">
        <img src={logo} alt="HR Dashboard Logo" className="logo-box" />
      </div>

      <nav className="sidebar-nav">
        {menu.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
            title={isOpen ? '' : item.label}
          >
            <span className="nav-icon">{ICONS[item.id]}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* <div className="sidebar-footer">
        {isOpen && <span>Admin HR</span>}
      </div> */}

    </aside>
  )
}
