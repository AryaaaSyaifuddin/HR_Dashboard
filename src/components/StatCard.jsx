import './StatCard.css'

export default function StatCard({ label, value, sub, subColor = 'muted', barColor = 'red' }) {
  return (
    <div className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {sub && (
        <p className={`stat-sub stat-sub--${subColor}`}>{sub}</p>
      )}
      <div className={`stat-bar stat-bar--${barColor}`}></div>
    </div>
  )
}
