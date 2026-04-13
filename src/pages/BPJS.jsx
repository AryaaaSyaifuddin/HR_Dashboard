import { useState, useEffect, useCallback, memo } from 'react'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './BPJS.css'

const API_URL = 'http://127.0.0.1:5000/bpjs/dashboard'
const NAVY = '#060771', RED = '#BF1A1A', GREEN = '#16a34a', ORANGE = '#ea580c', TEAL = '#0f766e'

const fmtRupiah = (n) => {
  if (n == null || isNaN(n)) return 'Rp 0'
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n)
}
const fmtShort = (n) => {
  if (n == null || isNaN(n)) return '0'
  return new Intl.NumberFormat('id-ID', { notation: 'compact', compactDisplay: 'short' }).format(n)
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bp-tooltip">
      {label && <p className="bp-tooltip-label">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || NAVY }}>
          {p.name}: <strong>{fmtRupiah(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

// Format periode: "Wed, 10 Dec 2025 ..." → "Des 2025"
const formatPeriode = (periodeStr) => {
  if (!periodeStr) return ''
  const date = new Date(periodeStr)
  if (isNaN(date)) return periodeStr
  return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
}

function BPJS() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [options, setOptions] = useState({ project: [], periode: [] })
  const [topProject, setTopProject] = useState('5')
  const [filters, setFilters] = useState({ project: '', jenis_bpjs: '', periode: '' })

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (f.project) p.append('project', f.project)
      if (f.jenis_bpjs) p.append('jenis_bpjs', f.jenis_bpjs)
      if (f.periode) p.append('periode', f.periode)
      const res = await fetch(p.toString() ? `${API_URL}?${p}` : API_URL)
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

  useEffect(() => {
    fetchData()
    fetch(API_URL)
      .then(r => r.json())
      .then(j => {
        const periodeSet = new Set((j.trend || []).map(d => d.periode).filter(Boolean))
        setOptions({
          project: (j.project || []).map(d => d.project),
          periode: [...periodeSet].sort()
        })
      })
      .catch(() => {})
  }, [])

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }))
  const apply = () => fetchData(filters)
  const reset = () => {
    const empty = { project: '', jenis_bpjs: '', periode: '' }
    setFilters(empty)
    fetchData(empty)
  }

  if (loading) return (
    <div className="bp-wrap">
      <div className="bp-loading">
        <div className="bp-spin" />
        <p>Memuat data...</p>
      </div>
    </div>
  )
  if (error) return (
    <div className="bp-wrap">
      <div className="bp-err">
        <p>Gagal: {error}</p>
        <button onClick={() => fetchData()}>Coba lagi</button>
      </div>
    </div>
  )
  if (!data) return null

  const { kpi, project, trend, jenis } = data

  // Hitung total peserta & persentase per jenis
  const totalPeserta = kpi?.total_karyawan_bpjs || 0
  const jenisMap = {}
  jenis?.forEach(j => { jenisMap[j.jenis_bpjs] = j.jumlah })
  const kesehatanJml = jenisMap['bpjs kesehatan'] || 0
  const permanentJml = jenisMap['bpjs ketenagakerjaan permanen'] || 0
  const boronganJml = jenisMap['bpjs ketenagakerjaan borongan'] || 0

  const pctKes = totalPeserta ? ((kesehatanJml / totalPeserta) * 100).toFixed(1) : '0.0'
  const pctPerm = totalPeserta ? ((permanentJml / totalPeserta) * 100).toFixed(1) : '0.0'
  const pctBor = totalPeserta ? ((boronganJml / totalPeserta) * 100).toFixed(1) : '0.0'

  // Gabungkan tren dengan sorting yang benar (by date)
  const periodeMap = {}
  ;(trend || []).forEach(d => {
    const rawDate = new Date(d.periode)
    const timestamp = rawDate.getTime()
    const label = formatPeriode(d.periode)
    if (!periodeMap[timestamp]) {
      periodeMap[timestamp] = {
        periode: label,
        timestamp,
        kesehatan: 0,
        tk_permanent: 0,
        tk_borongan: 0
      }
    }
    if (d.kategori === 'kesehatan') periodeMap[timestamp].kesehatan = d.pembayaran || 0
    if (d.kategori === 'tk_permanent') periodeMap[timestamp].tk_permanent = d.pembayaran || 0
    if (d.kategori === 'tk_borongan') periodeMap[timestamp].tk_borongan = d.pembayaran || 0
  })
  const combinedTrend = Object.values(periodeMap).sort((a, b) => a.timestamp - b.timestamp)

  const projectSorted = [...(project || [])].sort((a, b) => b.jumlah - a.jumlah)
  const projectSliced = topProject === '5' ? projectSorted.slice(0, 5)
                      : topProject === '10' ? projectSorted.slice(0, 10)
                      : projectSorted

  return (
    <div className="bp-wrap">

      {/* FILTER */}
      <div className="bp-filter">
        <div className="bp-fi">
          <div className="bp-fg">
            <label className="bp-fl">Project</label>
            <select className="bp-fs" value={filters.project} onChange={e => setF('project', e.target.value)}>
              <option value="">Semua Project</option>
              {options.project.map((v, i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="bp-fd" />
          <div className="bp-fg">
            <label className="bp-fl">Jenis BPJS</label>
            <select className="bp-fs" value={filters.jenis_bpjs} onChange={e => setF('jenis_bpjs', e.target.value)}>
              <option value="">Semua Jenis</option>
              <option value="bpjs kesehatan">Kesehatan</option>
              <option value="bpjs ketenagakerjaan permanen">TK Permanent</option>
              <option value="bpjs ketenagakerjaan borongan">TK Borongan</option>
            </select>
          </div>
          <div className="bp-fd" />
          <div className="bp-fg">
            <label className="bp-fl">Periode</label>
            <select className="bp-fs" value={filters.periode} onChange={e => setF('periode', e.target.value)}>
              <option value="">Semua Periode</option>
              {options.periode.map((v, i) => (
                <option key={i} value={v}>{formatPeriode(v)}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="bp-fa">
          <button className="bp-br" onClick={reset}>Reset</button>
          <button className="bp-ba" onClick={apply}>Terapkan</button>
        </div>
      </div>

      {/* KPI CARDS dengan Persentase */}
      <div className="mp-kpi4">
        {[
          {
            bg: '#e8e9f9',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" fill={NAVY}/><circle cx="17" cy="7" r="3" fill={NAVY} opacity=".4"/><path d="M1 20c0-4 3.6-7 8-7s8 3 8 7" fill={NAVY} opacity=".3"/></svg>,
            pct: '100%',
            pctC: NAVY,
            val: totalPeserta,
            lbl: 'Total Peserta',
            bar: NAVY
          },
          {
            bg: '#dcfce7',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l6 3v5c0 4-2.5 7-6 8.5C8.5 18 6 15 6 11V6l6-3z" fill={GREEN} opacity=".8"/></svg>,
            pct: `${pctKes}%`,
            pctC: GREEN,
            val: kesehatanJml,
            lbl: 'BPJS Kesehatan',
            bar: GREEN
          },
          {
            bg: '#fff3e0',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" fill={ORANGE} opacity=".8"/><path d="M8 6V5a4 4 0 018 0v1" fill={ORANGE}/></svg>,
            pct: `${pctPerm}%`,
            pctC: ORANGE,
            val: permanentJml,
            lbl: 'TK Permanent',
            bar: ORANGE
          },
          {
            bg: '#f0fdfa',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" fill={TEAL} opacity=".8"/><path d="M8 6V5a4 4 0 018 0v1" fill={TEAL}/><path d="M9 13l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
            pct: `${pctBor}%`,
            pctC: TEAL,
            val: boronganJml,
            lbl: 'TK Borongan',
            bar: TEAL
          }
        ].map((c, i) => (
          <div key={i} className="mp-kcard">
            <div className="mp-ktop">
              <div className="mp-kico" style={{ background: c.bg }}>{c.icon}</div>
              <span className="mp-kpct" style={{ color: c.pctC }}>{c.pct}</span>
            </div>
            <p className="mp-kval">{c.val}</p>
            <p className="mp-klbl">{c.lbl}</p>
            <div className="mp-kbar" style={{ background: c.bar }}/>
          </div>
        ))}
      </div>

      {/* TREND AREA CHART (Tanpa Pie) */}
      <div className="bp-card">
        <p className="bp-ctitle">Tren Pembayaran BPJS</p>
        <p className="bp-cdesc">Perbandingan nominal pembayaran per kategori (Rp)</p>
        {combinedTrend.length === 0 ? (
          <p className="bp-nodata">Tidak ada data</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={combinedTrend} margin={{ top: 8, right: 16, left: 20, bottom: 40 }}>
              <defs>
                <linearGradient id="gBpKes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBpPerm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ORANGE} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gBpBor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={TEAL} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={TEAL} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false} />
              <XAxis dataKey="periode" tick={{ fontSize: 11, fill: '#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#888' }} tickFormatter={v => fmtShort(v)} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="kesehatan" name="Kesehatan" stroke={GREEN} strokeWidth={2} fill="url(#gBpKes)" dot={{ r: 3, fill: GREEN, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="tk_permanent" name="TK Permanent" stroke={ORANGE} strokeWidth={2} fill="url(#gBpPerm)" dot={{ r: 3, fill: ORANGE, strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="tk_borongan" name="TK Borongan" stroke={TEAL} strokeWidth={2} fill="url(#gBpBor)" dot={{ r: 3, fill: TEAL, strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* BAR CHART Peserta per Project */}
      <div className="bp-card">
        <div className="bp-card-header">
          <div>
            <p className="bp-ctitle">Peserta BPJS per Project</p>
            <p className="bp-cdesc">Jumlah karyawan terdaftar BPJS di setiap project</p>
          </div>
          <div className="bp-top-toggle">
            {['5', '10', 'all'].map(v => (
              <button
                key={v}
                className={`bp-top-btn ${topProject === v ? 'bp-top-btn--active' : ''}`}
                onClick={() => setTopProject(v)}
              >
                {v === 'all' ? 'All' : `Top ${v}`}
              </button>
            ))}
          </div>
        </div>
        {projectSliced.length === 0 ? (
          <p className="bp-nodata">Tidak ada data</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(200, projectSliced.length * 34)}>
            <BarChart data={projectSliced} layout="vertical" barCategoryGap="13%" margin={{ top: 0, right: 50, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="project" tick={{ fontSize: 11, fill: '#444' }} width={120} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="jumlah" name="Peserta" fill={NAVY} BarSize={35} radius={[0, 4, 4, 0]} maxBarSize={35}
                label={{ position: 'right', fontSize: 11, fill: NAVY, fontWeight: 600 }} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

export default memo(BPJS)
