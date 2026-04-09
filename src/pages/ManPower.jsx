import { useEffect, useState, memo } from 'react'
import axios from 'axios'
import {
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import './ManPower.css'

const API_URL = 'http://127.0.0.1:5000/manpower/dashboard'

const RED    = '#BF1A1A'
const NAVY   = '#060771'
const ORANGE = '#ea580c'
const GREEN  = '#16a34a'

const STATUS_COLORS = {
  permanent: NAVY,
  kontrak:   RED,
}

// =========================================
// CUSTOM TOOLTIP — lebih bersih dari default
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
        <p key={i} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// =========================================
// KOMPONEN UTAMA
// =========================================
function ManPower() {

  // ===== STATE DATA =====
  const [data, setData] = useState({
    kpi: { total: 0, permanent: 0, kontrak: 0 },
    jabatan: [],
    branch: [],
    group_project: [],
    status_kontrak: []
  })
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  // ===== STATE FILTER =====
  const [filters, setFilters] = useState({
    branch: '', jabatan: '', status_kontrak: '', group_project: ''
  })

  // opsi dropdown diambil sekali dari data awal (tanpa filter)
  const [options, setOptions] = useState({
    branch: [], jabatan: [], status_kontrak: [], group_project: []
  })

  // ===== FETCH =====
  const fetchData = (q = {}) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q.branch)          params.append('branch', q.branch)
    if (q.jabatan)         params.append('jabatan', q.jabatan)
    if (q.status_kontrak)  params.append('status_kontrak', q.status_kontrak)
    if (q.group_project)   params.append('group_project', q.group_project)
    const url = params.toString() ? `${API_URL}?${params}` : API_URL
    axios.get(url)
      .then(res => { setData(res.data); setError(null) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  // load awal + ambil opsi filter
  useEffect(() => {
    fetchData()
    axios.get(API_URL).then(res => {
      setOptions({
        branch:         res.data.branch.map(d => d.branch),
        jabatan:        res.data.jabatan.map(d => d.jabatan),
        status_kontrak: res.data.status_kontrak.map(d => d.status_kontrak),
        group_project:  res.data.group_project.map(d => d.group_project),
      })
    }).catch(() => {})
  }, [])

  const applyFilter  = () => fetchData(filters)
  const resetFilter  = () => {
    const empty = { branch: '', jabatan: '', status_kontrak: '', group_project: '' }
    setFilters(empty)
    fetchData(empty)
  }
  const setF = (key, val) => setFilters(prev => ({ ...prev, [key]: val }))

  // ===== DERIVED =====
  const total     = data.kpi.total     || 0
  const permanent = data.kpi.permanent || 0
  const kontrak   = data.kpi.kontrak   || 0
  const pctPerm   = total ? Math.round((permanent / total) * 100) : 0
  const pctKon    = total ? Math.round((kontrak   / total) * 100) : 0

  // Pie — status kontrak
  const pieData = data.status_kontrak.map((d, i) => ({
    name:  d.status_kontrak.charAt(0).toUpperCase() + d.status_kontrak.slice(1),
    value: d.jumlah,
    color: i === 0 ? NAVY : i === 1 ? RED : ORANGE
  }))

  // Top jabatan untuk horizontal bar (max 10)
  const topJabatan = [...data.jabatan]
    .sort((a, b) => b.jumlah - a.jumlah)
    .slice(0, 10)

  // Branch data — langsung dari API
  const branchData = data.branch

  // Group project — sorted
  const gpData = [...data.group_project]
    .sort((a, b) => b.jumlah - a.jumlah)

  // ===== LOADING / ERROR =====
  if (loading) return (
    <div className="mp-wrapper">
      <div className="mp-loading">
        <div className="mp-spinner" />
        <p>Memuat data...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="mp-wrapper">
      <div className="mp-error">
        <p>Gagal memuat data: {error}</p>
        <button onClick={() => fetchData(filters)}>Coba lagi</button>
      </div>
    </div>
  )

  return (
    <div className="mp-wrapper">

      {/* ===== FILTER BAR — compact ===== */}
      <div className="mp-filter-bar">
        <div className="mp-filter-inner">

          <div className="mp-filter-group">
            <label className="mp-filter-label">Branch</label>
            <select className="mp-filter-select" value={filters.branch}
              onChange={e => setF('branch', e.target.value)}>
              <option value="">Semua</option>
              {options.branch.map((v, i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="mp-filter-divider" />

          <div className="mp-filter-group">
            <label className="mp-filter-label">Jabatan</label>
            <select className="mp-filter-select" value={filters.jabatan}
              onChange={e => setF('jabatan', e.target.value)}>
              <option value="">Semua</option>
              {options.jabatan.map((v, i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="mp-filter-divider" />

          <div className="mp-filter-group">
            <label className="mp-filter-label">Status Kontrak</label>
            <select className="mp-filter-select" value={filters.status_kontrak}
              onChange={e => setF('status_kontrak', e.target.value)}>
              <option value="">Semua</option>
              {options.status_kontrak.map((v, i) => (
                <option key={i} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="mp-filter-divider" />

          <div className="mp-filter-group">
            <label className="mp-filter-label">Group Project</label>
            <select className="mp-filter-select" value={filters.group_project}
              onChange={e => setF('group_project', e.target.value)}>
              <option value="">Semua</option>
              {options.group_project.map((v, i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>

        </div>
        <div className="mp-filter-actions">
          <button className="mp-btn-reset" onClick={resetFilter}>Reset</button>
          <button className="mp-btn-apply" onClick={applyFilter}>Terapkan</button>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="mp-kpi-grid">

        {/* Total */}
        <div className="mp-kpi-card">
          <div className="mp-kpi-top">
            <div className="mp-kpi-icon" style={{ background: '#e8e9f9' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="7" r="4" fill={NAVY}/>
                <circle cx="17" cy="7" r="3" fill={NAVY} opacity=".45"/>
                <path d="M1 20c0-4 3.6-7 8-7s8 3 8 7" fill={NAVY} opacity=".35"/>
                <path d="M17 13c2.5 0 5 1.5 5 4" stroke={NAVY} strokeWidth="1.5" fill="none" opacity=".45"/>
              </svg>
            </div>
            <span className="mp-kpi-pct" style={{ color: NAVY }}>Total</span>
          </div>
          <p className="mp-kpi-value">{total.toLocaleString()}</p>
          <p className="mp-kpi-label">Total Karyawan</p>
          <div className="mp-kpi-bar" style={{ background: NAVY }} />
        </div>

        {/* Permanent */}
        <div className="mp-kpi-card">
          <div className="mp-kpi-top">
            <div className="mp-kpi-icon" style={{ background: '#dcfce7' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l6 3v5c0 4-2.5 7-6 8.5C8.5 18 6 15 6 11V6l6-3z" fill={GREEN} opacity=".8"/>
              </svg>
            </div>
            <span className="mp-kpi-pct" style={{ color: GREEN }}>{pctPerm}%</span>
          </div>
          <p className="mp-kpi-value">{permanent.toLocaleString()}</p>
          <p className="mp-kpi-label">Karyawan Permanent</p>
          <div className="mp-kpi-bar" style={{ background: GREEN }} />
        </div>

        {/* Kontrak */}
        <div className="mp-kpi-card">
          <div className="mp-kpi-top">
            <div className="mp-kpi-icon" style={{ background: '#f9e8e8' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="13" rx="2" fill={RED} opacity=".8"/>
                <path d="M8 6V5a4 4 0 018 0v1" fill={RED}/>
              </svg>
            </div>
            <span className="mp-kpi-pct" style={{ color: RED }}>{pctKon}%</span>
          </div>
          <p className="mp-kpi-value">{kontrak.toLocaleString()}</p>
          <p className="mp-kpi-label">Karyawan Kontrak</p>
          <div className="mp-kpi-bar" style={{ background: RED }} />
        </div>

        {/* Rasio Permanent */}
        <div className="mp-kpi-card">
          <div className="mp-kpi-top">
            <div className="mp-kpi-icon" style={{ background: '#fff3e0' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 17l5-5 4 4 7-8" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <span className="mp-kpi-pct" style={{ color: ORANGE }}>ratio</span>
          </div>
          <p className="mp-kpi-value">{pctPerm}<span style={{ fontSize: 16, fontWeight: 400, color: '#888', marginLeft: 2 }}>%</span></p>
          <p className="mp-kpi-label">Rasio Permanent</p>
          <div className="mp-kpi-bar" style={{ background: ORANGE }} />
        </div>

      </div>

      {/* ===== ROW 1: Donut + Horizontal Bar Jabatan ===== */}
      <div className="mp-row-2" style={{ gridTemplateColumns: '0.85fr 1.45fr' }}>

        {/* Donut — Status Kontrak */}
        <div className="mp-card">
          <p className="mp-card-title">Komposisi Status Kontrak</p>
          <p className="mp-card-desc">Perbandingan jumlah per jenis kontrak</p>
          {pieData.length === 0
            ? <p className="mp-no-data">Tidak ada data</p>
            : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={78}
                      paddingAngle={3} cornerRadius={4}
                      dataKey="value"
                    >
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mp-pie-legend">
                  {pieData.map((d, i) => (
                    <div key={i} className="mp-legend-item">
                      <span className="mp-legend-left">
                        <span className="mp-legend-dot" style={{ background: d.color }} />
                        <span className="mp-legend-name">{d.name}</span>
                      </span>
                      <span className="mp-legend-val">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )
          }
        </div>

        {/* Horizontal Bar — Top Jabatan */}
        <div className="mp-card">
          <p className="mp-card-title">Distribusi Jabatan</p>
          <p className="mp-card-desc">Jumlah karyawan per posisi jabatan (top 10)</p>
          {topJabatan.length === 0
            ? <p className="mp-no-data">Tidak ada data</p>
            : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={topJabatan}
                  layout="vertical"
                  barCategoryGap="25%"
                  margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#282828' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="jabatan" tick={{ fontSize: 11, fill: '#212121' }} width={170} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="jumlah" name="Jumlah" fill={NAVY} barSize={20} radius={[0, 4, 4, 0]} maxBarSize={20}
                    label={{ position: 'right', fontSize: 11, fill: NAVY, fontWeight: 600 }} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

      </div>

    <div className="mp-card">
        <p className="mp-card-title">Distribusi Group Project</p>
        <p className="mp-card-desc">Jumlah karyawan per kelompok project / divisi kerja</p>
        {gpData.length === 0
          ? <p className="mp-no-data">Tidak ada data</p>
          : (
            <ResponsiveContainer width="100%" height={Math.max(240, gpData.length * 36)}>
              <BarChart
                data={gpData}
                layout="vertical"
                barCategoryGap="30%"
                margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#2f2f2f' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="group_project" tick={{ fontSize: 11, fill: '#222222' }} width={170} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="jumlah" name="Jumlah" fill={NAVY} BarSize={30} radius={[0, 4, 4, 0]} maxBarSize={30}
                  label={{ position: 'right', fontSize: 11, fill: NAVY, fontWeight: 600 }} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

    <div className="mp-card">
      <p className="mp-card-title">Distribusi Karyawan per Branch</p>
      <p className="mp-card-desc">Jumlah karyawan di setiap cabang / lokasi kerja</p>
      {branchData.length === 0 ? (
        <p className="mp-no-data">Tidak ada data</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(260, branchData.length * 36)}>   {/* ← tinggi dinamis */}
          <BarChart
            data={branchData}
            layout="vertical"
            barCategoryGap="30%"
            margin={{ top: 0, right: 60, left: 30, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="branch"
              width={140}                                     
              tick={{ fontSize: 12, fill: '#444' }}
              axisLine={false}
              tickLine={false}
              interval={0}                                     
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="jumlah" name="Jumlah" fill={RED} BarSize={30} radius={[0, 4, 4, 0]} maxBarSize={30}
              label={{ position: 'right', fontSize: 12, fill: RED, fontWeight: 600 }} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>

        </div>
  )
}

export default memo(ManPower)
