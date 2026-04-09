import { useState, useEffect, useCallback, memo } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import './Training.css'

const API_URL = 'http://127.0.0.1:5000/training/dashboard'

const NAVY   = '#060771'
const RED    = '#BF1A1A'
const GREEN  = '#16a34a'
const ORANGE = '#ea580c'
const AMBER  = '#b45309'
const PURPLE = '#7c3aed'

// Warna jenis
const JENIS_COLORS   = { internal: NAVY, external: RED }
// Warna status
const STATUS_COLORS  = { done: GREEN, 'in progress': NAVY, cancel: RED }
const STATUS_PIE_C   = [GREEN, NAVY, RED, ORANGE, AMBER]
const JENIS_PIE_C    = [NAVY, RED]

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
function Training() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [options, setOptions] = useState({ divisi: [], status: [] })

  const [filters, setFilters] = useState({
    jenis: '', divisi: '', status: '', startMonth: '', endMonth: ''
  })

  // ===== FETCH =====
  const fetchData = useCallback(async (f = filters) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (f.jenis)      params.append('jenis', f.jenis)
      if (f.divisi)     params.append('divisi', f.divisi)
      if (f.status)     params.append('status', f.status)
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

  // load awal + opsi filter
  useEffect(() => {
    fetchData()
    fetch(API_URL).then(r => r.json()).then(json => {
      setOptions({
        divisi: (json.divisi  || []).map(d => d.divisi),
        status: (json.status  || []).map(d => d.status),
      })
    }).catch(() => {})
  }, [])

  const setF        = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))
  const applyFilter = () => fetchData(filters)
  const resetFilter = () => {
    const empty = { jenis: '', divisi: '', status: '', startMonth: '', endMonth: '' }
    setFilters(empty)
    fetchData(empty)
  }

  // ===== LOADING / ERROR =====
  if (loading) return (
    <div className="tr-wrapper">
      <div className="tr-loading"><div className="tr-spinner" /><p>Memuat data...</p></div>
    </div>
  )
  if (error) return (
    <div className="tr-wrapper">
      <div className="tr-error">
        <p>Gagal memuat: {error}</p>
        <button onClick={() => fetchData()}>Coba lagi</button>
      </div>
    </div>
  )
  if (!data) return null

  const { kpi, jenis, divisi, pelatihan, status, trend } = data
  const total     = kpi?.total      || 0
  const pctInt    = total ? Math.round((kpi.internal    / total) * 100) : 0
  const pctExt    = total ? Math.round((kpi.external    / total) * 100) : 0
  const pctDone   = total ? Math.round((kpi.done        / total) * 100) : 0
  const pctInProg = total ? Math.round((kpi.in_progress / total) * 100) : 0
  const pctCancel = total ? Math.round((kpi.cancel      / total) * 100) : 0

  // Pie jenis
  const pieJenis = (jenis || []).map((d, i) => ({
    ...d, color: JENIS_PIE_C[i % JENIS_PIE_C.length]
  }))

  // Pie status
  const pieStatus = (status || []).map((d, i) => ({
    ...d, color: STATUS_COLORS[d.status] || STATUS_PIE_C[i]
  }))

  // Divisi & pelatihan sorted
  const divisiSorted    = [...(divisi    || [])].sort((a, b) => b.jumlah - a.jumlah)
  const pelatihanSorted = [...(pelatihan || [])].sort((a, b) => b.jumlah - a.jumlah)

  return (
    <div className="tr-wrapper">

      {/* ===== FILTER BAR ===== */}
      <div className="tr-filter-bar">
        <div className="tr-filter-inner">

          <div className="tr-filter-group">
            <label className="tr-filter-label">Jenis</label>
            <select className="tr-filter-select" value={filters.jenis}
              onChange={e => setF('jenis', e.target.value)}>
              <option value="">Semua</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>
          </div>

          <div className="tr-filter-divider" />

          <div className="tr-filter-group">
            <label className="tr-filter-label">Divisi</label>
            <select className="tr-filter-select" value={filters.divisi}
              onChange={e => setF('divisi', e.target.value)}>
              <option value="">Semua Divisi</option>
              {options.divisi.map((v, i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="tr-filter-divider" />

          <div className="tr-filter-group">
            <label className="tr-filter-label">Status</label>
            <select className="tr-filter-select" value={filters.status}
              onChange={e => setF('status', e.target.value)}>
              <option value="">Semua Status</option>
              <option value="done">Done</option>
              <option value="in progress">In Progress</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>

          <div className="tr-filter-divider" />

          <div className="tr-filter-group">
            <label className="tr-filter-label">Periode Mulai</label>
            <input type="month" className="tr-filter-select"
              value={filters.startMonth}
              onChange={e => setF('startMonth', e.target.value)} />
          </div>

          <div className="tr-filter-divider" />

          <div className="tr-filter-group">
            <label className="tr-filter-label">Periode Akhir</label>
            <input type="month" className="tr-filter-select"
              value={filters.endMonth}
              onChange={e => setF('endMonth', e.target.value)} />
          </div>

        </div>
        <div className="tr-filter-actions">
          <button className="tr-btn-reset" onClick={resetFilter}>Reset</button>
          <button className="tr-btn-apply" onClick={applyFilter}>Terapkan</button>
        </div>
      </div>

      {/* ===== KPI CARDS — 6 card, 2 baris ===== */}
      <div className="tr-kpi-grid">

        <div className="tr-kpi-card">
          <div className="tr-kpi-top">
            <div className="tr-kpi-icon" style={{ background: '#e8e9f9' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="12" rx="1.5" stroke={NAVY} strokeWidth="1.8" fill="none"/>
                <path d="M8 21h8M12 16v5" stroke={NAVY} strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="tr-kpi-pct" style={{ color: NAVY }}>Total</span>
          </div>
          <p className="tr-kpi-value">{total}</p>
          <p className="tr-kpi-label">Total Pelatihan</p>
          <div className="tr-kpi-bar" style={{ background: NAVY }} />
        </div>

        <div className="tr-kpi-card">
          <div className="tr-kpi-top">
            <div className="tr-kpi-icon" style={{ background: '#e8e9f9' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l6 3v5c0 4-2.5 7-6 8.5C8.5 18 6 15 6 11V6l6-3z" fill={NAVY} opacity=".8"/>
              </svg>
            </div>
            <span className="tr-kpi-pct" style={{ color: NAVY }}>{pctInt}%</span>
          </div>
          <p className="tr-kpi-value">{kpi.internal || 0}</p>
          <p className="tr-kpi-label">Internal</p>
          <div className="tr-kpi-bar" style={{ background: NAVY }} />
        </div>

        <div className="tr-kpi-card">
          <div className="tr-kpi-top">
            <div className="tr-kpi-icon" style={{ background: '#f9e8e8' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={RED} strokeWidth="2" fill="none"/>
                <path d="M12 8v4M12 16h.01" stroke={RED} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="tr-kpi-pct" style={{ color: RED }}>{pctExt}%</span>
          </div>
          <p className="tr-kpi-value">{kpi.external || 0}</p>
          <p className="tr-kpi-label">External</p>
          <div className="tr-kpi-bar" style={{ background: RED }} />
        </div>

        <div className="tr-kpi-card">
          <div className="tr-kpi-top">
            <div className="tr-kpi-icon" style={{ background: '#dcfce7' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="tr-kpi-pct" style={{ color: GREEN }}>{pctDone}%</span>
          </div>
          <p className="tr-kpi-value">{kpi.done || 0}</p>
          <p className="tr-kpi-label">Done</p>
          <div className="tr-kpi-bar" style={{ background: GREEN }} />
        </div>

        <div className="tr-kpi-card">
          <div className="tr-kpi-top">
            <div className="tr-kpi-icon" style={{ background: '#fff3e0' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={ORANGE} strokeWidth="2" fill="none"/>
                <path d="M12 7v5l3 3" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="tr-kpi-pct" style={{ color: ORANGE }}>{pctInProg}%</span>
          </div>
          <p className="tr-kpi-value">{kpi.in_progress || 0}</p>
          <p className="tr-kpi-label">In Progress</p>
          <div className="tr-kpi-bar" style={{ background: ORANGE }} />
        </div>

        <div className="tr-kpi-card">
          <div className="tr-kpi-top">
            <div className="tr-kpi-icon" style={{ background: '#fef3c7' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={AMBER} strokeWidth="2" fill="none"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke={AMBER} strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="tr-kpi-pct" style={{ color: AMBER }}>{pctCancel}%</span>
          </div>
          <p className="tr-kpi-value">{kpi.cancel || 0}</p>
          <p className="tr-kpi-label">Cancel</p>
          <div className="tr-kpi-bar" style={{ background: AMBER }} />
        </div>

      </div>

      {/* ===== ROW 1: Donut Jenis (35%) + Area Trend (65%) ===== */}
      <div className="tr-row-2" style={{ gridTemplateColumns: '0.7fr 1.4fr' }}>

        {/* Donut — Jenis Internal vs External */}
        <div className="tr-card">
          <p className="tr-card-title">Internal vs External</p>
          <p className="tr-card-desc">Perbandingan jenis pelatihan yang diikuti</p>
          {pieJenis.length === 0
            ? <p className="tr-no-data">Tidak ada data</p>
            : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieJenis} cx="50%" cy="50%"
                      innerRadius={48} outerRadius={72}
                      paddingAngle={4} cornerRadius={4}
                      dataKey="jumlah" nameKey="jenis">
                      {pieJenis.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="tr-pie-legend">
                  {pieJenis.map((d, i) => (
                    <div key={i} className="tr-legend-item">
                      <span className="tr-legend-left">
                        <span className="tr-legend-dot" style={{ background: d.color }} />
                        <span className="tr-legend-name" style={{ textTransform: 'capitalize' }}>{d.jenis}</span>
                      </span>
                      <span className="tr-legend-val">{d.jumlah}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>

        {/* Area Chart — Tren */}
        <div className="tr-card">
          <p className="tr-card-title">Tren Pelatihan per Bulan</p>
          <p className="tr-card-desc">Jumlah peserta pelatihan setiap bulan</p>
          {(trend || []).length === 0
            ? <p className="tr-no-data">Tidak ada data</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="gradTr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={RED} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={RED} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false} />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="jumlah" name="Peserta" stroke={RED} strokeWidth={2} fill="url(#gradTr)" dot={{ r: 3, fill: RED, strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>

      </div>

      {/* ===== ROW 2: Horizontal Bar Divisi (50%) + Donut Status (50%) ===== */}
      <div className="tr-row-2" style={{ gridTemplateColumns: '1.3fr 0.9fr' }}>

        {/* Horizontal Bar — Divisi */}
        <div className="tr-card">
          <p className="tr-card-title">Peserta per Divisi</p>
          <p className="tr-card-desc">Jumlah karyawan mengikuti pelatihan per divisi</p>
          {divisiSorted.length === 0
            ? <p className="tr-no-data">Tidak ada data</p>
            : (
              <ResponsiveContainer width="100%" height={Math.max(200, divisiSorted.length * 34)}>
                <BarChart data={divisiSorted} layout="vertical" barCategoryGap="30%"
                  margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="divisi" tick={{ fontSize: 11, fill: '#444' }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="jumlah" name="Peserta" fill={NAVY} radius={[0, 4, 4, 0]} maxBarSize={20}
                    label={{ position: 'right', fontSize: 11, fill: NAVY, fontWeight: 600 }} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Donut — Status Pelatihan */}
        <div className="tr-card">
          <p className="tr-card-title">Status Pelatihan</p>
          <p className="tr-card-desc">Done, In Progress, dan Cancel</p>
          {pieStatus.length === 0
            ? <p className="tr-no-data">Tidak ada data</p>
            : (
              <>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={pieStatus} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={76}
                      paddingAngle={3} cornerRadius={4}
                      dataKey="jumlah" nameKey="status">
                      {pieStatus.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="tr-pie-legend">
                  {pieStatus.map((d, i) => (
                    <div key={i} className="tr-legend-item">
                      <span className="tr-legend-left">
                        <span className="tr-legend-dot" style={{ background: d.color }} />
                        <span className="tr-legend-name" style={{ textTransform: 'capitalize' }}>{d.status}</span>
                      </span>
                      <span className="tr-legend-val">{d.jumlah}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>

      </div>

      {/* ===== ROW 3: Horizontal Bar Pelatihan — FULL WIDTH ===== */}
      <div className="tr-card">
        <p className="tr-card-title">Jenis Pelatihan Terpopuler</p>
        <p className="tr-card-desc">Nama-nama pelatihan yang paling banyak diikuti</p>
        {pelatihanSorted.length === 0
          ? <p className="tr-no-data">Tidak ada data</p>
          : (
            <ResponsiveContainer width="100%" height={Math.max(220, pelatihanSorted.length * 34)}>
              <BarChart data={pelatihanSorted} layout="vertical" barCategoryGap="28%"
                margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="pelatihan" tick={{ fontSize: 11, fill: '#444' }} width={180} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="jumlah" name="Peserta" fill={RED} radius={[0, 4, 4, 0]} maxBarSize={20}
                  label={{ position: 'right', fontSize: 11, fill: RED, fontWeight: 600 }} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

    </div>
  )
}

export default memo(Training)
