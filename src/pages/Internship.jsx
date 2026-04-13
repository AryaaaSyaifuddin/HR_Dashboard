import './Placeholder.css'
import { useEffect, useState } from "react"
import axios from "axios"
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts"

const API_URL = "http://127.0.0.1:5000/internship/dashboard"
const COLORS  = ["#060771","#BF1A1A","#a0a0b0","#FF9800","#4CAF50","#2196F3","#9C27B0"]
const NAVY    = '#060771', RED = '#BF1A1A'

const cleanVal = v => (!v || v === 'nan' || v === 'NaN' || String(v).trim().toLowerCase() === 'nan') ? 'No Status' : v

// Fungsi untuk mengurutkan data permohonan berdasarkan bulan
const sortPermohonanByDate = (permohonanArray) => {
  if (!permohonanArray || !permohonanArray.length) return []
  return [...permohonanArray].sort((a, b) => {
    const dateA = new Date(a.bulan)
    const dateB = new Date(b.bulan)
    return dateA - dateB
  })
}

export default function Internship() {
  const [data, setData] = useState({
    kpi:{ onboard:0, butuh_surat_balasan:0, ajukan_ulang:0, selesai:0, akan_berakhir:0, total:0 },
    institusi:[], permohonan:[], penempatan:[], ket:[]
  })
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [topPenem, setTopPenem]   = useState('5')
  const [filters, setFilters]     = useState({ institusi:"", penempatan:"", status:"", start:"", end:"" })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [dateRange, setDateRange] = useState([null, null])
  const [filterOptions, setFilterOptions] = useState({
    institusi:[], penempatan:[],
    status:["onboard","butuh surat balasan","ajukan ulang","selesai"]
  })

  const fetchDashboard = (queryParams = {}) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (queryParams.institusi)  params.append("institusi", queryParams.institusi)
    if (queryParams.penempatan) params.append("penempatan", queryParams.penempatan)
    if (queryParams.status)     params.append("status", queryParams.status)
    if (queryParams.start)      params.append("start", queryParams.start)
    if (queryParams.end)        params.append("end", queryParams.end)
    const url = params.toString() ? `${API_URL}?${params}` : API_URL
    axios.get(url)
      .then(res => {
        // Urutkan data permohonan berdasarkan tanggal
        const sortedData = {
          ...res.data,
          permohonan: sortPermohonanByDate(res.data.permohonan)
        }
        setData(sortedData)
        setError(null)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDashboard() }, [])

  useEffect(() => {
    axios.get(API_URL).then(res => {
      setFilterOptions(prev => ({
        ...prev,
        institusi: res.data.institusi.map(item => cleanVal(item.institusi)),
        penempatan: res.data.penempatan.map(item => cleanVal(item.penempatan))
      }))
    }).catch(() => {})
  }, [])

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const applyFilters  = () => fetchDashboard(filters)
  const resetFilters  = () => { setFilters({ institusi:"",penempatan:"",status:"",start:"",end:"" }); fetchDashboard() }

  if (loading) return <div className="internship-wrapper"><p style={{ color:"#666" }}>⏳ Loading...</p></div>
  if (error)   return <div className="internship-wrapper"><p style={{ color:"#d32f2f" }}>❌ Error: {error}</p></div>

  const totalIntern = data.kpi.total || 0
  const toPercent   = v => totalIntern ? Math.round(((v||0)/totalIntern)*100) : 0

  // Clean NaN di semua data
  const cleanInstitusi  = data.institusi.map(d  => ({ ...d, institusi: cleanVal(d.institusi) }))
  const cleanPenempatan = data.penempatan.map(d => ({ ...d, penempatan: cleanVal(d.penempatan) }))
  const cleanKet        = data.ket.map(d        => ({ ...d, ket: cleanVal(d.ket) }))

  const sortedInstitusi = [...cleanInstitusi].sort((a,b) => (b.jumlah||0)-(a.jumlah||0))
  const topInstitusi    = sortedInstitusi.slice(0,8)

  const penemSorted = [...cleanPenempatan].sort((a,b) => b.jumlah-a.jumlah)
  const penemSliced = topPenem==='5' ? penemSorted.slice(0,5) : topPenem==='10' ? penemSorted.slice(0,10) : penemSorted

  return (
    <div className="internship-wrapper">

      {/* FILTER */}
      <div className="ifilter-bar">
        <div className="ifilter-inner">
          <div className="ifilter-group">
            <label className="ifilter-label">Institusi</label>
            <select className="ifilter-select" value={filters.institusi} onChange={e => handleFilterChange("institusi", e.target.value)}>
              <option value="">Semua</option>
              {filterOptions.institusi.map((v,i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="ifilter-divider"/>
          <div className="ifilter-group">
            <label className="ifilter-label">Penempatan</label>
            <select className="ifilter-select" value={filters.penempatan} onChange={e => handleFilterChange("penempatan", e.target.value)}>
              <option value="">Semua Divisi</option>
              {filterOptions.penempatan.map((v,i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="ifilter-divider"/>
          <div className="ifilter-group">
            <label className="ifilter-label">Status</label>
            <select className="ifilter-select" value={filters.status} onChange={e => handleFilterChange("status", e.target.value)}>
              <option value="">Semua Status</option>
              {filterOptions.status.map((v,i) => <option key={i} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
            </select>
          </div>
          <div className="ifilter-divider"/>
          <div className="ifilter-group ifilter-group--date">
            <label className="ifilter-label">Periode</label>
            <input type="text" className="ifilter-select"
              value={dateRange[0]&&dateRange[1] ? `${dateRange[0].toLocaleDateString('id-ID')} – ${dateRange[1].toLocaleDateString('id-ID')}` : dateRange[0] ? dateRange[0].toLocaleDateString('id-ID') : "Semua tanggal"}
              readOnly onClick={() => setShowDatePicker(!showDatePicker)} style={{ cursor:'pointer', minWidth:160 }}/>
            {showDatePicker && (
              <div className="date-picker-wrapper">
                <Calendar selectRange value={dateRange} onChange={value => {
                  setDateRange(value)
                  if (value[0]&&value[1]) {
                    setFilters(p => ({ ...p, start:value[0].toISOString().split('T')[0], end:value[1].toISOString().split('T')[0] }))
                    setTimeout(() => setShowDatePicker(false), 200)
                  }
                }}/>
              </div>
            )}
          </div>
        </div>
        <div className="ifilter-actions">
          <button className="ifilter-reset" onClick={resetFilters}>Reset</button>
          <button className="ifilter-apply" onClick={applyFilters}>Terapkan</button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="ikpi-grid">
        {[
          { status:"", bg:"#e8e9f9", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#060771"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#060771" opacity=".35"/></svg>, pct:"Semua", pctC:NAVY, val:totalIntern, lbl:"Total Intern", bar:NAVY },
          { status:"onboard", bg:"#dcfce7", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, pct:`${toPercent(data.kpi.onboard)}%`, pctC:"#16a34a", val:data.kpi.onboard||0, lbl:"On Board", bar:"#16a34a" },
          { status:"butuh surat balasan", bg:"#fef3c7", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#b45309" strokeWidth="1.8" fill="none"/><path d="M3 9l9 6 9-6" stroke="#b45309" strokeWidth="1.8"/></svg>, pct:`${toPercent(data.kpi.butuh_surat_balasan)}%`, pctC:"#b45309", val:data.kpi.butuh_surat_balasan||0, lbl:"Butuh Balasan", bar:"#b45309" },
          { status:"ajukan ulang", bg:"#fff3e0", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4v5h5M20 20v-5h-5" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round"/><path d="M20 9A8 8 0 005.3 7.3M4 15a8 8 0 0014.7 1.7" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round"/></svg>, pct:`${toPercent(data.kpi.ajukan_ulang)}%`, pctC:"#ea580c", val:data.kpi.ajukan_ulang||0, lbl:"Ajukan Ulang", bar:"#ea580c" },
          { status:"selesai", bg:"#f9e8e8", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" fill="#BF1A1A" opacity=".8"/><path d="M8 6V5a4 4 0 018 0v1" fill="#BF1A1A"/></svg>, pct:`${toPercent(data.kpi.selesai)}%`, pctC:RED, val:data.kpi.selesai||0, lbl:"Selesai", bar:RED },
        ].map((c,i) => (
          <div key={i} className="ikpi-card">
            <div className="ikpi-top">
              <div className="ikpi-icon" style={{ background:c.bg }}>{c.icon}</div>
              <span className="ikpi-pct" style={{ color:c.pctC }}>{c.pct}</span>
            </div>
            <p className="ikpi-value">{c.val}</p>
            <p className="ikpi-label">{c.lbl}</p>
            <div className="ikpi-bar" style={{ background:c.bar }}/>
          </div>
        ))}
      </div>

      {/* TREN PERMOHONAN */}
      <div className="chart-card chart-card--row1">
        <p className="chart-title">Tren Permohonan Internship</p>
        <p className="chart-desc">Jumlah permohonan masuk per bulan</p>
        {data.permohonan.length === 0 ? <p className="no-data">No Data Available</p> : (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={data.permohonan} margin={{ top:8, right:16, left:0, bottom:40 }}>
              <defs>
                <linearGradient id="gradPermohonan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RED} stopOpacity={0.22}/>
                  <stop offset="100%" stopColor={RED} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
              <XAxis dataKey="bulan" tick={{ fontSize:11, fill:"#242424" }} angle={0} textAnchor="center" height={5} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:"#272727" }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"0.5px solid #e0e0e0" }}/>
              <Area type="monotone" dataKey="jumlah" name="Permohonan" stroke={RED} strokeWidth={2} fill="url(#gradPermohonan)" dot={{ r:3, fill:RED, strokeWidth:0 }} activeDot={{ r:5 }}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ROW 3-KOLOM: Institusi | Tingkat Pendidikan | Penempatan (lebih lebar) */}
      <div className="int-row3">

        {/* Institusi — ranking list */}
        <div className="chart-card">
          <p className="chart-title">Distribusi Institusi</p>
          <p className="chart-desc">Jumlah peserta dari tiap institusi asal</p>
          {cleanInstitusi.length === 0 ? <p className="no-data">No Data Available</p> : (
            <div className="institusi-list">
              <p className="institusi-list-title">Ranking Top 8</p>
              {topInstitusi.map((item,idx) => (
                <div key={idx} className="institusi-item">
                  <span className="institusi-name">{idx+1}. {item.institusi}</span>
                  <span className="institusi-count">{item.jumlah||0}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tingkat Pendidikan — donut */}
        <div className="chart-card chart-card--ket">
          <p className="chart-title">Tingkat Pendidikan</p>
          <p className="chart-desc">Komposisi peserta berdasarkan jenjang pendidikan</p>
          {cleanKet.length === 0 ? <p className="no-data">No Data Available</p> : (
            <div className="ket-chart">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={cleanKet} cx="50%" cy="50%" labelLine={false} label={false}
                    innerRadius={44} outerRadius={68} paddingAngle={3} cornerRadius={4} dataKey="jumlah">
                    {cleanKet.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"0.5px solid #e0e0e0" }}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="ket-legend">
                {cleanKet.map((entry,i) => (
                  <div key={i} className="ket-legend-item">
                    <span className="ket-legend-left">
                      <span className="ket-legend-dot" style={{ backgroundColor:COLORS[i%COLORS.length] }}/>
                      <span className="ket-legend-label">{entry.ket}</span>
                    </span>
                    <span className="ket-legend-value">{entry.jumlah}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Penempatan — bar vertikal + top filter */}
        <div className="chart-card int-penem-card">
          <div className="int-card-header">
            <div>
              <p className="chart-title">Distribusi Penempatan</p>
              <p className="chart-desc">Jumlah peserta magang per divisi</p>
            </div>
            <div className="int-top-toggle">
              {['5','10','all'].map(v => (
                <button key={v} className={`int-top-btn${topPenem===v?' int-top-btn--active':''}`}
                  onClick={() => setTopPenem(v)}>
                  {v==='all'?'All':`Top ${v}`}
                </button>
              ))}
            </div>
          </div>
          {penemSliced.length === 0 ? <p className="no-data">No Data Available</p> : (
            <ResponsiveContainer width="100%" height={Math.max(220, penemSliced.length*34)}>
              <BarChart data={penemSliced} layout="vertical" barCategoryGap="13%"
                margin={{ top:0, right:50, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:11, fill:"#1f1f1f" }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="penempatan" tick={{ fontSize:11, fill:"#1a1a1a" }} width={120} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"0.5px solid #e0e0e0" }}/>
                <Bar dataKey="jumlah" name="Jumlah" fill={RED} BarSize={35} radius={[0,4,4,0]} maxBarSize={35}
                  label={{ position:'right', fontSize:11, fill:RED, fontWeight:600 }}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>
    </div>
  )
}