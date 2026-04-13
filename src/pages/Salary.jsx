import { useEffect, useState, memo } from 'react'
import axios from 'axios'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import './Salary.css'

const API_URL = 'http://127.0.0.1:5000/salary/dashboard'
const NAVY = '#060771', RED = '#BF1A1A', GREEN = '#16a34a', ORANGE = '#ea580c', TEAL = '#0f766e'

// Helper format Rupiah
const fmtRupiah = (n) => {
  if (n == null || isNaN(n)) return 'Rp 0'
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n))
}

// Custom Tooltip
const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      {label && <p style={{ fontWeight: 600, color: NAVY, marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => {
        let value = p.value
        const name = p.name?.toLowerCase() || ''
        if (name.includes('gaji') || name.includes('pph') || name.includes('cost')) {
          value = fmtRupiah(p.value)
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

function Salary() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [options, setOptions] = useState({ projects: [], periods: [] })
  const [filters, setFilters] = useState({ project: '', periode: '' })
  const [topGaji, setTopGaji] = useState('all')
  const [topPph, setTopPph] = useState('all')

  const fetchData = (q = {}) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q.project) params.append('project', q.project)
    if (q.periode) params.append('periode', q.periode)
    const url = params.toString() ? `${API_URL}?${params}` : API_URL
    axios.get(url)
      .then(res => { setData(res.data); setError(null) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
    // Ambil opsi project dan periode dari data awal
    axios.get(API_URL).then(res => {
      const projects = [...new Set(res.data.gaji_project?.map(d => d.project) || [])]
      const periods = [...new Set(res.data.gaji_trend?.map(d => d.periode) || [])]
      setOptions({ projects, periods })
    }).catch(() => {})
  }, [])

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }))
  const apply = () => fetchData(filters)
  const reset = () => {
    const empty = { project: '', periode: '' }
    setFilters(empty)
    fetchData(empty)
  }

  if (loading) return (
    <div className="sl-wrap">
      <div className="sl-loading">
        <div className="sl-spin" />
        <p>Memuat data...</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="sl-wrap">
      <div className="sl-err">
        <p>Gagal: {error}</p>
        <button onClick={() => fetchData(filters)}>Coba lagi</button>
      </div>
    </div>
  )
  if (!data) return null

  const { kpi, gaji_trend, pph_trend, gaji_project, pph_project } = data

  // Sorting dan slicing untuk chart gaji per project
  const gajiSorted = [...(gaji_project || [])].sort((a, b) => b.gaji - a.gaji)
  const gajiSliced = topGaji === '5' ? gajiSorted.slice(0, 5) : topGaji === '10' ? gajiSorted.slice(0, 10) : gajiSorted

  // Sorting dan slicing untuk chart PPh21 per project
  const pphSorted = [...(pph_project || [])].sort((a, b) => b.pph21 - a.pph21)
  const pphSliced = topPph === '5' ? pphSorted.slice(0, 5) : topPph === '10' ? pphSorted.slice(0, 10) : pphSorted

  return (
    <div className="sl-wrap">

      {/* FILTER */}
      <div className="sl-filter">
        <div className="sl-fi">
          <div className="sl-fg">
            <label className="sl-fl">Project</label>
            <select className="sl-fs" value={filters.project} onChange={e => setF('project', e.target.value)}>
              <option value="">Semua Project</option>
              {options.projects.map((v, i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="sl-fd" />
          <div className="sl-fg">
            <label className="sl-fl">Periode</label>
            <select className="sl-fs" value={filters.periode} onChange={e => setF('periode', e.target.value)}>
              <option value="">Semua Periode</option>
              {options.periods.map((v, i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="sl-fa">
          <button className="sl-br" onClick={reset}>Reset</button>
          <button className="sl-ba" onClick={apply}>Terapkan</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="sl-kpi3">
        {[
          { bg: '#e8e9f9', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" fill={NAVY} opacity=".8"/><path d="M8 6V5a4 4 0 018 0v1" fill={NAVY}/></svg>, val: fmtRupiah(kpi?.total_gaji), lbl: 'Total Gaji', bar: NAVY },
          { bg: '#f9e8e8', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l6 3v5c0 4-2.5 7-6 8.5C8.5 18 6 15 6 11V6l6-3z" fill={RED} opacity=".8"/></svg>, val: fmtRupiah(kpi?.total_pph21), lbl: 'Total PPh21', bar: RED },
          { bg: '#dcfce7', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" fill={GREEN}/><circle cx="17" cy="7" r="3" fill={GREEN} opacity=".4"/><path d="M1 20c0-4 3.6-7 8-7s8 3 8 7" fill={GREEN} opacity=".3"/></svg>, val: kpi?.jumlah_project || 0, lbl: 'Jumlah Project', bar: GREEN },
        ].map((c, i) => (
          <div key={i} className="sl-kcard">
            <div className="sl-ktop">
              <div className="sl-kico" style={{ background: c.bg }}>{c.icon}</div>
            </div>
            <p className="sl-kval">{c.val}</p>
            <p className="sl-klbl">{c.lbl}</p>
            <div className="sl-kbar" style={{ background: c.bar }} />
          </div>
        ))}
      </div>

      {/* ROW 1: Tren Gaji & Tren PPh21 */}
      <div className="sl-row2">
        <div className="sl-card">
          <p className="sl-ctitle">Tren Total Gaji Bulanan</p>
          <p className="sl-cdesc">Total pengeluaran gaji per bulan</p>
          {(gaji_trend || []).length === 0 ? <p className="sl-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={gaji_trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs><linearGradient id="gajiGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={NAVY} stopOpacity={0.2} /><stop offset="100%" stopColor={NAVY} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" />
                <XAxis dataKey="periode" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={v => fmtRupiah(v)} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Area type="monotone" dataKey="gaji" name="Total Gaji" stroke={NAVY} strokeWidth={2} fill="url(#gajiGrad)" dot={{ r: 3, fill: NAVY }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="sl-card">
          <p className="sl-ctitle">Tren PPh21 Bulanan</p>
          <p className="sl-cdesc">Total PPh21 yang dibayarkan per bulan</p>
          {(pph_trend || []).length === 0 ? <p className="sl-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={pph_trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs><linearGradient id="pphGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={RED} stopOpacity={0.2} /><stop offset="100%" stopColor={RED} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" />
                <XAxis dataKey="periode" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={v => fmtRupiah(v)} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Area type="monotone" dataKey="pph21" name="PPh21" stroke={RED} strokeWidth={2} fill="url(#pphGrad)" dot={{ r: 3, fill: RED }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ROW 2: Gaji per Project & PPh21 per Project */}
      <div className="sl-row2">
        {/* Gaji per Project */}
        <div className="sl-card">
          <div className="sl-card-header">
            <div>
              <p className="sl-ctitle">Total Gaji per Project</p>
              <p className="sl-cdesc">Akumulasi gaji untuk setiap project</p>
            </div>
            <div className="sl-top-toggle">
              {['5', '10', 'all'].map(v => (
                <button key={v} className={`sl-top-btn ${topGaji === v ? 'sl-top-btn--active' : ''}`}
                  onClick={() => setTopGaji(v)}>
                  {v === 'all' ? 'All' : `Top ${v}`}
                </button>
              ))}
            </div>
          </div>
          {gajiSliced.length === 0 ? <p className="sl-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={Math.max(240, gajiSliced.length * 28)}>
              <BarChart data={gajiSliced} layout="vertical" barCategoryGap="10%" margin={{ top: 0, right: 70, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} tickFormatter={v => fmtRupiah(v)} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="project" tick={{ fontSize: 11, fill: '#444' }} width={130} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Bar dataKey="gaji" name="Total Gaji" fill={NAVY} radius={[0, 4, 4, 0]} maxBarSize={25}
                  label={{ position: 'right', fontSize: 11, fill: NAVY, fontWeight: 600, formatter: v => fmtRupiah(v) }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* PPh21 per Project */}
        <div className="sl-card">
          <div className="sl-card-header">
            <div>
              <p className="sl-ctitle">Total PPh21 per Project</p>
              <p className="sl-cdesc">Akumulasi PPh21 untuk setiap project</p>
            </div>
            <div className="sl-top-toggle">
              {['5', '10', 'all'].map(v => (
                <button key={v} className={`sl-top-btn ${topPph === v ? 'sl-top-btn--active' : ''}`}
                  onClick={() => setTopPph(v)}>
                  {v === 'all' ? 'All' : `Top ${v}`}
                </button>
              ))}
            </div>
          </div>
          {pphSliced.length === 0 ? <p className="sl-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={Math.max(240, pphSliced.length * 28)}>
              <BarChart data={pphSliced} layout="vertical" barCategoryGap="10%" margin={{ top: 0, right: 70, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} tickFormatter={v => fmtRupiah(v)} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="project" tick={{ fontSize: 11, fill: '#444' }} width={130} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Bar dataKey="pph21" name="PPh21" fill={RED} radius={[0, 4, 4, 0]} maxBarSize={25}
                  label={{ position: 'right', fontSize: 11, fill: RED, fontWeight: 600, formatter: v => fmtRupiah(v) }} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(Salary)