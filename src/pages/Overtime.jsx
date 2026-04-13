import { useEffect, useState, memo } from 'react'
import axios from 'axios'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import './Overtime.css'

const API_URL = 'http://127.0.0.1:5000/overtime/dashboard'
const NAVY = '#060771', RED = '#BF1A1A', GREEN = '#16a34a', ORANGE = '#ea580c', TEAL = '#0f766e'

// Helper format Rupiah
const fmtRupiah = (n) => {
  if (n == null || isNaN(n)) return 'Rp 0'
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n))
}

// Custom Tooltip yang sudah diperbaiki
const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      {label && <p style={{ fontWeight: 600, color: NAVY, marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => {
        let value = p.value
        const name = p.name?.toLowerCase() || ''
        if (name.includes('cost') || name.includes('biaya')) {
          value = fmtRupiah(p.value)
        } else if ((name.includes('overtime') || name.includes('absensi')) && !name.includes('cost')) {
          value = (p.value * 100).toFixed(1) + '%'
        } else {
          value = p.value
        }
        return (
          <p key={i} style={{ color: p.color || NAVY, margin: '2px 0' }}>
            {p.name}: <strong>{value}</strong>
          </p>
        )
      })}
    </div>
  )
}

function Overtime() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [options, setOptions] = useState({ projects: [] })
  const [filters, setFilters] = useState({ project: '', start: '', end: '' })
  const [topOv, setTopOv] = useState('all')
  const [topCost, setTopCost] = useState('all')

  const fetchData = (q = {}) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q.project) params.append('project', q.project)
    if (q.start)   params.append('start', q.start)
    if (q.end)     params.append('end', q.end)
    const url = params.toString() ? `${API_URL}?${params}` : API_URL
    axios.get(url)
      .then(res => { setData(res.data); setError(null) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    axios.get(API_URL).then(res => {
      const projects = [...new Set(res.data.overtime_by_project?.map(d => d.project) || [])]
      setOptions({ projects })
    }).catch(() => {})
  }, [])

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }))
  const apply = () => fetchData(filters)
  const reset = () => {
    const empty = { project: '', start: '', end: '' }
    setFilters(empty)
    fetchData(empty)
  }

  if (loading) return (
    <div className="ot-wrap">
      <div className="ot-loading">
        <div className="ot-spin" />
        <p>Memuat data...</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="ot-wrap">
      <div className="ot-err">
        <p>Gagal: {error}</p>
        <button onClick={() => fetchData(filters)}>Coba lagi</button>
      </div>
    </div>
  )
  if (!data) return null

  const { kpi, overtime_summary, attendance_summary, overtime_by_project, cost_by_project, overtime_cost_trend } = data

  const ovSummary = overtime_summary || []
  const attSummary = attendance_summary || []
  const costTrend = overtime_cost_trend || []

  // 🔧 BUAT SALINAN ARRAY SEBELUM SORTING (HINDARI READ-ONLY ERROR)
  const ovProjectSorted = [...(overtime_by_project || [])].sort((a, b) => b.overtime_percent - a.overtime_percent)
  const costProjectSorted = [...(cost_by_project || [])].sort((a, b) => b.overtime_cost - a.overtime_cost)

  // Slicing berdasarkan toggle
  const topOvProject = topOv === '5' ? ovProjectSorted.slice(0, 5) : topOv === '10' ? ovProjectSorted.slice(0, 10) : ovProjectSorted
  const topCostProject = topCost === '5' ? costProjectSorted.slice(0, 5) : topCost === '10' ? costProjectSorted.slice(0, 10) : costProjectSorted

  return (
    <div className="ot-wrap">

      {/* FILTER */}
      <div className="ot-filter">
        <div className="ot-fi">
          <div className="ot-fg">
            <label className="ot-fl">Project</label>
            <select className="ot-fs" value={filters.project} onChange={e => setF('project', e.target.value)}>
              <option value="">Semua Project</option>
              {options.projects.map((v, i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="ot-fd" />
          <div className="ot-fg">
            <label className="ot-fl">Periode Mulai</label>
            <input type="date" className="ot-fs" value={filters.start} onChange={e => setF('start', e.target.value)} />
          </div>
          <div className="ot-fd" />
          <div className="ot-fg">
            <label className="ot-fl">Periode Akhir</label>
            <input type="date" className="ot-fs" value={filters.end} onChange={e => setF('end', e.target.value)} />
          </div>
        </div>
        <div className="ot-fa">
          <button className="ot-br" onClick={reset}>Reset</button>
          <button className="ot-ba" onClick={apply}>Terapkan</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="ot-kpi4">
        {[
          { bg: '#fff3e0', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 17l5-5 4 4 7-8" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" fill="none" /></svg>, pct: kpi.overtime_growth ? `${kpi.overtime_growth > 0 ? '+' : ''}${kpi.overtime_growth}%` : '—', pctC: kpi.overtime_growth >= 0 ? GREEN : RED, val: `${kpi.avg_overtime_percent || 0}%`, lbl: 'Rata‑rata Overtime', bar: ORANGE },
          { bg: '#dcfce7', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l6 3v5c0 4-2.5 7-6 8.5C8.5 18 6 15 6 11V6l6-3z" fill={GREEN} opacity=".8" /></svg>, pct: kpi.absensi_growth ? `${kpi.absensi_growth > 0 ? '+' : ''}${kpi.absensi_growth}%` : '—', pctC: kpi.absensi_growth >= 0 ? GREEN : RED, val: `${kpi.avg_absensi_percent || 0}%`, lbl: 'Rata‑rata Absensi', bar: GREEN },
          { bg: '#f9e8e8', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" fill={RED} opacity=".8" /><path d="M8 6V5a4 4 0 018 0v1" fill={RED} /></svg>, pct: 'Total', pctC: RED, val: fmtRupiah(kpi.total_overtime_cost), lbl: 'Total Biaya Overtime', bar: RED },
          { bg: '#f0fdfa', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={TEAL} strokeWidth="2" strokeLinecap="round" fill="none" /></svg>, pct: 'All', pctC: TEAL, val: fmtRupiah(kpi.total_cost), lbl: 'Total Biaya Keseluruhan', bar: TEAL },
        ].map((c, i) => (
          <div key={i} className="ot-kcard">
            <div className="ot-ktop">
              <div className="ot-kico" style={{ background: c.bg }}>{c.icon}</div>
              <span className="ot-kpct" style={{ color: c.pctC }}>{c.pct}</span>
            </div>
            <p className="ot-kval">{c.val}</p>
            <p className="ot-klbl">{c.lbl}</p>
            <div className="ot-kbar" style={{ background: c.bar }} />
          </div>
        ))}
      </div>

      {/* ROW 1: Overtime & Attendance Trend */}
      <div className="ot-row2">
        <div className="ot-card">
          <p className="ot-ctitle">Tren Overtime Bulanan</p>
          <p className="ot-cdesc">Persentase rata‑rata overtime per bulan</p>
          {ovSummary.length === 0 ? <p className="ot-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={ovSummary} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs><linearGradient id="ovGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={ORANGE} stopOpacity={0.2} /><stop offset="100%" stopColor={ORANGE} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={v => (v * 100).toFixed(0) + '%'} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Area type="monotone" dataKey="overtime" name="Overtime" stroke={ORANGE} strokeWidth={2} fill="url(#ovGrad)" dot={{ r: 3, fill: ORANGE }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="ot-card">
          <p className="ot-ctitle">Tren Absensi Bulanan</p>
          <p className="ot-cdesc">Persentase rata‑rata kehadiran per bulan</p>
          {attSummary.length === 0 ? <p className="ot-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={attSummary} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs><linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GREEN} stopOpacity={0.2} /><stop offset="100%" stopColor={GREEN} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={v => (v * 100).toFixed(0) + '%'} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Area type="monotone" dataKey="absensi" name="Absensi" stroke={GREEN} strokeWidth={2} fill="url(#attGrad)" dot={{ r: 3, fill: GREEN }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ROW 2: Overtime Cost Trend */}
      <div className="ot-card">
        <p className="ot-ctitle">Tren Biaya Overtime</p>
        <p className="ot-cdesc">Total biaya overtime per bulan</p>
        {costTrend.length === 0 ? <p className="ot-nodata">Tidak ada data</p> : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={costTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <defs><linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={RED} stopOpacity={0.2} /><stop offset="100%" stopColor={RED} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={v => fmtRupiah(v)} axisLine={false} tickLine={false} />
              <Tooltip content={<CT />} />
              <Area type="monotone" dataKey="overtime_cost" name="Biaya Overtime" stroke={RED} strokeWidth={2} fill="url(#costGrad)" dot={{ r: 3, fill: RED }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ROW 3: Overtime % per Project & Cost per Project (dengan toggle) */}
      <div className="ot-row2">
        {/* Overtime % per Project */}
        <div className="ot-card">
          <div className="ot-card-header">
            <div>
              <p className="ot-ctitle">Persentase Overtime per Project</p>
              <p className="ot-cdesc">Rata‑rata overtime per project</p>
            </div>
            <div className="ot-top-toggle">
              {['5', '10', 'all'].map(v => (
                <button key={v} className={`ot-top-btn ${topOv === v ? 'ot-top-btn--active' : ''}`}
                  onClick={() => setTopOv(v)}>
                  {v === 'all' ? 'All' : `Top ${v}`}
                </button>
              ))}
            </div>
          </div>
          {topOvProject.length === 0 ? <p className="ot-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={Math.max(240, topOvProject.length * 28)}>
              <BarChart data={topOvProject} layout="vertical" barCategoryGap="10%" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} tickFormatter={v => v + '%'} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="project" tick={{ fontSize: 11, fill: '#444' }} width={130} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Bar dataKey="overtime_percent" name="Overtime %" fill={NAVY} radius={[0, 4, 4, 0]} maxBarSize={25}
                  label={{ position: 'right', fontSize: 11, fill: NAVY, fontWeight: 600, formatter: v => v + '%' }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Biaya Overtime per Project */}
        <div className="ot-card">
          <div className="ot-card-header">
            <div>
              <p className="ot-ctitle">Biaya Overtime per Project</p>
              <p className="ot-cdesc">Total biaya overtime per project</p>
            </div>
            <div className="ot-top-toggle">
              {['5', '10', 'all'].map(v => (
                <button key={v} className={`ot-top-btn ${topCost === v ? 'ot-top-btn--active' : ''}`}
                  onClick={() => setTopCost(v)}>
                  {v === 'all' ? 'All' : `Top ${v}`}
                </button>
              ))}
            </div>
          </div>
          {topCostProject.length === 0 ? <p className="ot-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={Math.max(240, topCostProject.length * 28)}>
              <BarChart data={topCostProject} layout="vertical" barCategoryGap="10%" margin={{ top: 0, right: 70, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} tickFormatter={v => fmtRupiah(v)} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="project" tick={{ fontSize: 11, fill: '#444' }} width={130} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Bar dataKey="overtime_cost" name="Biaya Overtime" fill={RED} radius={[0, 4, 4, 0]} maxBarSize={25}
                  label={{ position: 'right', fontSize: 11, fill: RED, fontWeight: 600, formatter: v => fmtRupiah(v) }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(Overtime)