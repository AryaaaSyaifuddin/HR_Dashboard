import { useState, useEffect, useCallback, memo } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import './Recruitment.css'

const API_URL = 'http://127.0.0.1:5000/recruitment/dashboard'

const RED    = '#BF1A1A'
const NAVY   = '#060771'
const GREEN  = '#16a34a'
const ORANGE = '#ea580c'
const AMBER  = '#b45309'
const PURPLE = '#7c3aed'

// Warna per status funnel — biar mudah dibaca di rapat
const FUNNEL_COLORS = {
  'on process':       NAVY,
  'mcu':              AMBER,
  'accepted':         GREEN,
  'rejected':         RED,
  'mengundurkan diri':ORANGE,
}

const STATUS_PIE_COLORS = [GREEN, NAVY, ORANGE, RED, PURPLE]

// =========================================
// CUSTOM TOOLTIP
// =========================================
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12
    }}>
      {label && <p style={{ fontWeight: 600, color: NAVY, marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || NAVY, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// =========================================
// KOMPONEN UTAMA
// =========================================
function Recruitment() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [options, setOptions] = useState({ posisi: [] })

  const [filters, setFilters] = useState({
    status: '', posisi: '', startMonth: '', endMonth: ''
  })

  // ===== FETCH =====
  const fetchData = useCallback(async (f = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.status) params.append('status', f.status)
      if (f.posisi) params.append('posisi', f.posisi)
      if (f.startMonth) params.append('start', `${f.startMonth}-01`)
      if (f.endMonth)   params.append('end',   `${f.endMonth}-01`)
      const url = params.toString() ? `${API_URL}?${params}` : API_URL
      const res = await fetch(url)
      if (!res.ok) throw new Error('Gagal mengambil data')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // load awal + ambil opsi posisi
  useEffect(() => {
    fetchData()
    fetch(API_URL).then(r => r.json()).then(json => {
      setOptions({ posisi: (json.posisi || []).map(d => d.posisi) })
    }).catch(() => {})
  }, [])

  const setF        = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))
  const applyFilter = () => fetchData(filters)
  const resetFilter = () => {
    const empty = { status: '', posisi: '', startMonth: '', endMonth: '' }
    setFilters(empty)
    fetchData(empty)
  }

  // ===== LOADING / ERROR =====
  if (loading) return (
    <div className="rc-wrapper">
      <div className="rc-loading"><div className="rc-spinner" /><p>Memuat data...</p></div>
    </div>
  )
  if (error) return (
    <div className="rc-wrapper">
      <div className="rc-error">
        <p>Gagal memuat: {error}</p>
        <button onClick={() => fetchData()}>Coba lagi</button>
      </div>
    </div>
  )
  if (!data) return null

  const { kpi, status, posisi, trend, funnel } = data
  const total  = kpi?.total || 0
  const pctAcc = total ? Math.round((kpi.accepted  / total) * 100) : 0
  const pctOp  = total ? Math.round((kpi.on_process / total) * 100) : 0
  const pctRej = total ? Math.round((kpi.rejected   / total) * 100) : 0

  // Pie status — map warna
  const pieStatus = (status || []).map((d, i) => ({
    ...d, color: STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]
  }))

  // Posisi — horizontal bar, sorted
  const posisiSorted = [...(posisi || [])].sort((a, b) => b.jumlah - a.jumlah)

  // Funnel — beri warna per status
  const funnelColored = (funnel || []).map(d => ({
    ...d, color: FUNNEL_COLORS[d.status] || NAVY
  }))

  return (
    <div className="rc-wrapper">

      {/* ===== FILTER BAR ===== */}
      <div className="rc-filter-bar">
        <div className="rc-filter-inner">

          <div className="rc-filter-group">
            <label className="rc-filter-label">Status</label>
            <select className="rc-filter-select" value={filters.status}
              onChange={e => setF('status', e.target.value)}>
              <option value="">Semua</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="on process">On Process</option>
              <option value="mcu">MCU</option>
              <option value="mengundurkan diri">Mengundurkan Diri</option>
            </select>
          </div>

          <div className="rc-filter-divider" />

          <div className="rc-filter-group">
            <label className="rc-filter-label">Posisi</label>
            <select className="rc-filter-select" value={filters.posisi}
              onChange={e => setF('posisi', e.target.value)}>
              <option value="">Semua Posisi</option>
              {options.posisi.map((v, i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="rc-filter-divider" />

          <div className="rc-filter-group">
            <label className="rc-filter-label">Periode Mulai</label>
            <input type="month" className="rc-filter-select"
              value={filters.startMonth}
              onChange={e => setF('startMonth', e.target.value)} />
          </div>

          <div className="rc-filter-divider" />

          <div className="rc-filter-group">
            <label className="rc-filter-label">Periode Akhir</label>
            <input type="month" className="rc-filter-select"
              value={filters.endMonth}
              onChange={e => setF('endMonth', e.target.value)} />
          </div>

        </div>
        <div className="rc-filter-actions">
          <button className="rc-btn-reset" onClick={resetFilter}>Reset</button>
          <button className="rc-btn-apply" onClick={applyFilter}>Terapkan</button>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="rc-kpi-grid">

        <div className="rc-kpi-card">
          <div className="rc-kpi-top">
            <div className="rc-kpi-icon" style={{ background: '#e8e9f9' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="4" fill={NAVY}/>
                <circle cx="17" cy="7" r="3" fill={NAVY} opacity=".4"/>
                <path d="M1 20c0-4 3.6-7 8-7s8 3 8 7" fill={NAVY} opacity=".3"/>
                <path d="M17 13c2.5 0 5 1.5 5 4" stroke={NAVY} strokeWidth="1.5" fill="none" opacity=".4"/>
              </svg>
            </div>
            <span className="rc-kpi-pct" style={{ color: NAVY }}>Total</span>
          </div>
          <p className="rc-kpi-value">{total}</p>
          <p className="rc-kpi-label">Total Kandidat</p>
          <div className="rc-kpi-bar" style={{ background: NAVY }} />
        </div>

        <div className="rc-kpi-card">
          <div className="rc-kpi-top">
            <div className="rc-kpi-icon" style={{ background: '#dcfce7' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="rc-kpi-pct" style={{ color: GREEN }}>{pctAcc}%</span>
          </div>
          <p className="rc-kpi-value">{kpi.accepted || 0}</p>
          <p className="rc-kpi-label">Accepted</p>
          <div className="rc-kpi-bar" style={{ background: GREEN }} />
        </div>

        <div className="rc-kpi-card">
          <div className="rc-kpi-top">
            <div className="rc-kpi-icon" style={{ background: '#fff3e0' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={ORANGE} strokeWidth="2" fill="none"/>
                <path d="M12 7v5l3 3" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="rc-kpi-pct" style={{ color: ORANGE }}>{pctOp}%</span>
          </div>
          <p className="rc-kpi-value">{kpi.on_process || 0}</p>
          <p className="rc-kpi-label">On Process</p>
          <div className="rc-kpi-bar" style={{ background: ORANGE }} />
        </div>

        <div className="rc-kpi-card">
          <div className="rc-kpi-top">
            <div className="rc-kpi-icon" style={{ background: '#f9e8e8' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={RED} strokeWidth="2" fill="none"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke={RED} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="rc-kpi-pct" style={{ color: RED }}>{pctRej}%</span>
          </div>
          <p className="rc-kpi-value">{kpi.rejected || 0}</p>
          <p className="rc-kpi-label">Rejected</p>
          <div className="rc-kpi-bar" style={{ background: RED }} />
        </div>

      </div>

      {/* ===== ROW 1: Area Trend (60%) + Donut Status (40%) ===== */}
      <div className="rc-row-2" style={{ gridTemplateColumns: '1.5fr 1fr' }}>

        {/* Area Chart — Tren */}
        <div className="rc-card">
          <p className="rc-card-title">Tren Rekrutmen per Bulan</p>
          <p className="rc-card-desc">Jumlah kandidat masuk proses rekrutmen setiap bulan</p>
          {(trend || []).length === 0
            ? <p className="rc-no-data">Tidak ada data</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="gradRc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={NAVY} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false} />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="jumlah" name="Kandidat" stroke={NAVY} strokeWidth={2} fill="url(#gradRc)" dot={{ r: 3, fill: NAVY, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Donut — Distribusi Status */}
        <div className="rc-card">
          <p className="rc-card-title">Distribusi Status Kandidat</p>
          <p className="rc-card-desc">Komposisi status terkini seluruh kandidat</p>
          {pieStatus.length === 0
            ? <p className="rc-no-data">Tidak ada data</p>
            : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieStatus} cx="50%" cy="50%"
                      innerRadius={48} outerRadius={72}
                      paddingAngle={3} cornerRadius={4}
                      dataKey="jumlah" nameKey="status">
                      {pieStatus.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="rc-pie-legend">
                  {pieStatus.map((d, i) => (
                    <div key={i} className="rc-legend-item">
                      <span className="rc-legend-left">
                        <span className="rc-legend-dot" style={{ background: d.color }} />
                        <span className="rc-legend-name" style={{ textTransform: 'capitalize' }}>{d.status}</span>
                      </span>
                      <span className="rc-legend-val">{d.jumlah}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>

      </div>

      {/* ===== ROW 2: Horizontal Bar Posisi — FULL WIDTH ===== */}
      <div className="rc-card">
        <p className="rc-card-title">Kandidat per Posisi</p>
        <p className="rc-card-desc">Total pelamar untuk setiap posisi yang dibuka</p>
        {posisiSorted.length === 0
          ? <p className="rc-no-data">Tidak ada data</p>
          : (
            <ResponsiveContainer width="100%" height={Math.max(220, posisiSorted.length * 36)}>
              <BarChart data={posisiSorted} layout="vertical" barCategoryGap="30%"
                margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="posisi" tick={{ fontSize: 11, fill: '#444' }} width={160} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="jumlah" name="Kandidat" fill={NAVY} radius={[0, 4, 4, 0]} maxBarSize={22}
                  label={{ position: 'right', fontSize: 11, fill: NAVY, fontWeight: 600 }} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* ===== ROW 3: Funnel — FULL WIDTH ===== */}
      {funnelColored.length > 0 && (
        <div className="rc-card">
          <p className="rc-card-title">Funnel Rekrutmen</p>
          <p className="rc-card-desc">Sebaran kandidat di setiap tahap proses rekrutmen</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelColored} layout="vertical" barCategoryGap="30%"
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="status" tick={{ fontSize: 12, fill: '#444', textTransform: 'capitalize' }} width={140} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="jumlah" name="Jumlah" radius={[0, 4, 4, 0]} maxBarSize={24}
                label={{ position: 'right', fontSize: 12, fontWeight: 600 }}>
                {funnelColored.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}

export default memo(Recruitment)
