import './Topbar.css'


export default function Topbar({ title }) {
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="topbar">
      <h2 className="topbar-title">{title}</h2>
      <div className="topbar-right">
        <span className="topbar-badge">Apr 2026</span>
        <span className="topbar-date">{today}</span>
      </div>
    </header>
  )
}
