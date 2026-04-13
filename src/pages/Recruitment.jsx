import { useState, useEffect, useCallback, memo, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import './Recruitment.css'

const API_URL   = 'http://127.0.0.1:5000/recruitment/dashboard'
const RED       = '#BF1A1A'
const NAVY      = '#060771'
const GREEN     = '#16a34a'
const ORANGE    = '#ea580c'
const AMBER     = '#b45309'
const PURPLE    = '#7c3aed'
const FUNNEL_C  = { 
  'on process': NAVY,
  'mcu': AMBER,
  'accepted': GREEN,
  'rejected': RED,
  'mengundurkan diri': ORANGE 
}
const STATUS_PC = [GREEN, NAVY, ORANGE, RED, PURPLE]

// Month order mapping for sorting
const MONTH_ORDER = {
  'January': 1, 'February': 2, 'March': 3, 'April': 4,
  'May': 5, 'June': 6, 'July': 7, 'August': 8,
  'September': 9, 'October': 10, 'November': 11, 'December': 12
}

const cleanVal = v => (!v || v === 'nan' || v === 'NaN' || String(v).trim() === 'nan') ? 'No Status' : v

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ 
      background: '#fff', 
      border: '0.5px solid rgba(0,0,0,0.1)', 
      borderRadius: 8, 
      padding: '8px 12px', 
      fontSize: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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

function Recruitment() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [options, setOptions] = useState({ posisi: [] })
  const [topPosisi, setTopPosisi] = useState('5')
  const [filters, setFilters] = useState({ 
    status: '', 
    posisi: '', 
    startMonth: '', 
    endMonth: '' 
  })

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (f.status)     p.append('status', f.status)
      if (f.posisi)     p.append('posisi', f.posisi)
      if (f.startMonth) p.append('start', `${f.startMonth}-01`)
      if (f.endMonth)   p.append('end', `${f.endMonth}-01`)
      
      const res = await fetch(p.toString() ? `${API_URL}?${p}` : API_URL)
      if (!res.ok) throw new Error('Gagal mengambil data')
      setData(await res.json())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
    fetch(API_URL)
      .then(r => r.json())
      .then(j => setOptions({ 
        posisi: (j.posisi || []).map(d => cleanVal(d.posisi)) 
      }))
      .catch(() => {})
  }, [])

  // Sort trend data chronologically
  const sortedTrend = useMemo(() => {
    if (!data?.trend) return []
    
    return [...data.trend].sort((a, b) => {
      const [monthA, yearA] = a.bulan.split(' ')
      const [monthB, yearB] = b.bulan.split(' ')
      
      // Compare years first
      const yearDiff = parseInt(yearA) - parseInt(yearB)
      if (yearDiff !== 0) return yearDiff
      
      // If same year, compare months
      return MONTH_ORDER[monthA] - MONTH_ORDER[monthB]
    })
  }, [data?.trend])

  const setFilter = (key, value) => setFilters(p => ({ ...p, [key]: value }))
  const applyFilters = () => fetchData(filters)
  const resetFilters = () => {
    const empty = { status: '', posisi: '', startMonth: '', endMonth: '' }
    setFilters(empty)
    fetchData(empty)
  }

  if (loading) {
    return (
      <div className="rc-wrapper">
        <div className="rc-loading">
          <div className="rc-spinner" />
          <p>Memuat data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rc-wrapper">
        <div className="rc-error">
          <p>Gagal: {error}</p>
          <button onClick={() => fetchData()}>Coba lagi</button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { kpi, status, posisi, funnel } = data
  const total = kpi?.total || 0
  const pctAcc = total ? Math.round((kpi?.accepted || 0) / total * 100) : 0
  const pctOp = total ? Math.round((kpi?.on_process || 0) / total * 100) : 0
  const pctRej = total ? Math.round((kpi?.rejected || 0) / total * 100) : 0

  // Clean data
  const cleanStatus = (status || []).map(d => ({ 
    ...d, 
    status: cleanVal(d.status) 
  }))
  
  const cleanPosisi = (posisi || []).map(d => ({ 
    ...d, 
    posisi: cleanVal(d.posisi) 
  }))
  
  const cleanFunnel = (funnel || []).map(d => ({ 
    ...d, 
    status: cleanVal(d.status), 
    color: FUNNEL_C[d.status] || NAVY 
  }))

  const pieStatus = cleanStatus.map((d, i) => ({ 
    ...d, 
    color: STATUS_PC[i % STATUS_PC.length] 
  }))
  
  const posisiSorted = [...cleanPosisi].sort((a, b) => b.jumlah - a.jumlah)
  const posisiSliced = topPosisi === '5' 
    ? posisiSorted.slice(0, 5) 
    : topPosisi === '10' 
      ? posisiSorted.slice(0, 10) 
      : posisiSorted
      
  const statusContentHeight = 180 + (pieStatus.length * 31)
  const posisiChartHeight = Math.max(150, posisiSliced.length * 30 + 12, statusContentHeight)

  return (
    <div className="rc-wrapper">
      {/* FILTER BAR */}
      <div className="rc-filter-bar">
        <div className="rc-filter-inner">
          <div className="rc-filter-group">
            <label className="rc-filter-label">Status</label>
            <select 
              className="rc-filter-select" 
              value={filters.status} 
              onChange={e => setFilter('status', e.target.value)}
            >
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
            <select 
              className="rc-filter-select" 
              value={filters.posisi} 
              onChange={e => setFilter('posisi', e.target.value)}
            >
              <option value="">Semua Posisi</option>
              {options.posisi.map((v, i) => (
                <option key={i} value={v}>{v}</option>
              ))}
            </select>
          </div>
          
          <div className="rc-filter-divider" />
          
          <div className="rc-filter-group">
            <label className="rc-filter-label">Periode Mulai</label>
            <input 
              type="month" 
              className="rc-filter-select" 
              value={filters.startMonth} 
              onChange={e => setFilter('startMonth', e.target.value)}
            />
          </div>
          
          <div className="rc-filter-divider" />
          
          <div className="rc-filter-group">
            <label className="rc-filter-label">Periode Akhir</label>
            <input 
              type="month" 
              className="rc-filter-select" 
              value={filters.endMonth} 
              onChange={e => setFilter('endMonth', e.target.value)}
            />
          </div>
        </div>
        
        <div className="rc-filter-actions">
          <button className="rc-btn-reset" onClick={resetFilters}>
            Reset
          </button>
          <button className="rc-btn-apply" onClick={applyFilters}>
            Terapkan
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="rc-kpi-grid">
        {[
          { 
            bg: '#e8e9f9', 
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="4" fill={NAVY} />
                <circle cx="17" cy="7" r="3" fill={NAVY} opacity=".4" />
                <path d="M1 20c0-4 3.6-7 8-7s8 3 8 7" fill={NAVY} opacity=".3" />
              </svg>
            ), 
            pct: 'Total', 
            pctC: NAVY, 
            val: total, 
            lbl: 'Total Kandidat', 
            bar: NAVY 
          },
          { 
            bg: '#dcfce7', 
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ), 
            pct: `${pctAcc}%`, 
            pctC: GREEN, 
            val: kpi?.accepted || 0, 
            lbl: 'Accepted', 
            bar: GREEN 
          },
          { 
            bg: '#fff3e0', 
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={ORANGE} strokeWidth="2" fill="none" />
                <path d="M12 7v5l3 3" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ), 
            pct: `${pctOp}%`, 
            pctC: ORANGE, 
            val: kpi?.on_process || 0, 
            lbl: 'On Process', 
            bar: ORANGE 
          },
          { 
            bg: '#f9e8e8', 
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke={RED} strokeWidth="2" fill="none" />
                <path d="M15 9l-6 6M9 9l6 6" stroke={RED} strokeWidth="2" strokeLinecap="round" />
              </svg>
            ), 
            pct: `${pctRej}%`, 
            pctC: RED, 
            val: kpi?.rejected || 0, 
            lbl: 'Rejected', 
            bar: RED 
          },
        ].map((c, i) => (
          <div key={i} className="rc-kpi-card">
            <div className="rc-kpi-top">
              <div className="rc-kpi-icon" style={{ background: c.bg }}>
                {c.icon}
              </div>
              <span className="rc-kpi-pct" style={{ color: c.pctC }}>
                {c.pct}
              </span>
            </div>
            <p className="rc-kpi-value">{c.val}</p>
            <p className="rc-kpi-label">{c.lbl}</p>
            <div className="rc-kpi-bar" style={{ background: c.bar }} />
          </div>
        ))}
      </div>

      {/* TREND CHART */}
      <div className="rc-card">
        <p className="rc-card-title">Tren Rekrutmen per Bulan</p>
        <p className="rc-card-desc">Jumlah kandidat masuk proses rekrutmen setiap bulan</p>
        
        {sortedTrend.length === 0 ? (
          <p className="rc-no-data">Tidak ada data tren</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart 
                data={sortedTrend} 
                margin={{ top: 20, right: 30, left: 0, bottom: 15 }}
              >
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={NAVY} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAccepted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                
                <XAxis
                  dataKey="bulan"
                  tick={{ fontSize: 11, fill: '#333' }}
                  angle={0}
                  textAnchor="center"
                  height={5}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                />
                
                <YAxis
                  tick={{ fontSize: 11, fill: '#333' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
                />
                
                {/* Area for Total Candidates */}
                <Area
                  type="monotone"
                  dataKey="jumlah"
                  name="Total Kandidat"
                  stroke={NAVY}
                  strokeWidth={2.5}
                  fill="url(#gradTotal)"
                  dot={{ r: 4, fill: NAVY, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: NAVY }}
                />
                
                {/* Area for Accepted Candidates */}
                <Area
                  type="monotone"
                  dataKey="accepted"
                  name="Accepted"
                  stroke={GREEN}
                  strokeWidth={2.5}
                  fill="url(#gradAccepted)"
                  dot={{ r: 4, fill: GREEN, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: GREEN }}
                />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Custom Legend */}
            <div className="rc-trend-legend">
              <div className="rc-trend-legend-item">
                <span className="rc-trend-legend-dot" style={{ background: NAVY }} />
                <span>Total Kandidat</span>
              </div>
              <div className="rc-trend-legend-item">
                <span className="rc-trend-legend-dot" style={{ background: GREEN }} />
                <span>Accepted</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ROW: POSISI & STATUS */}
      <div className="rc-row-2" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        {/* POSISI CHART */}
        <div className="rc-card">
          <div className="rc-card-header">
            <div>
              <p className="rc-card-title">Kandidat per Posisi</p>
              <p className="rc-card-desc">Total pelamar untuk setiap posisi yang dibuka</p>
            </div>
            <div className="rc-top-toggle">
              {['5', '10', 'all'].map(v => (
                <button
                  key={v}
                  className={`rc-top-btn ${topPosisi === v ? 'rc-top-btn--active' : ''}`}
                  onClick={() => setTopPosisi(v)}
                >
                  {v === 'all' ? 'All' : `Top ${v}`}
                </button>
              ))}
            </div>
          </div>
          
          {posisiSliced.length === 0 ? (
            <p className="rc-no-data">Tidak ada data posisi</p>
          ) : (
            <ResponsiveContainer width="100%" height={posisiChartHeight}>
              <BarChart 
                data={posisiSliced} 
                layout="vertical" 
                barCategoryGap="15%"
                margin={{ top: 0, right: 55, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 11, fill: '#333' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                
                <YAxis 
                  type="category" 
                  dataKey="posisi" 
                  tick={{ fontSize: 11, fill: '#333' }} 
                  width={150} 
                  axisLine={false} 
                  tickLine={false} 
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Bar 
                  dataKey="jumlah" 
                  name="Kandidat" 
                  fill={NAVY} 
                  barSize={50} 
                  radius={[0, 4, 4, 0]} 
                  maxBarSize={50}
                  label={{ 
                    position: 'right', 
                    fontSize: 11, 
                    fill: NAVY, 
                    fontWeight: 600 
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* STATUS PIE CHART */}
        <div className="rc-card">
          <p className="rc-card-title">Distribusi Status Kandidat</p>
          <p className="rc-card-desc">Komposisi status terkini seluruh kandidat</p>
          
          {pieStatus.length === 0 ? (
            <p className="rc-no-data">Tidak ada data status</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    cornerRadius={4}
                    dataKey="jumlah"
                    nameKey="status"
                  >
                    {pieStatus.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="rc-pie-legend">
                {pieStatus.map((d, i) => (
                  <div key={i} className="rc-legend-item">
                    <span className="rc-legend-left">
                      <span className="rc-legend-dot" style={{ background: d.color }} />
                      <span className="rc-legend-name" style={{ textTransform: 'capitalize' }}>
                        {d.status}
                      </span>
                    </span>
                    <span className="rc-legend-val">{d.jumlah}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(Recruitment)