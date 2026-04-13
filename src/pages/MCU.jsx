import { useState, useEffect, useCallback, memo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './MCU.css'

const API_URL = 'http://127.0.0.1:5000/mcu/dashboard'
const NAVY    = '#060771', RED = '#BF1A1A', GREEN = '#16a34a'
const ORANGE  = '#ea580c', AMBER = '#b45309', PURPLE = '#7c3aed'

const fmt     = n => new Intl.NumberFormat('id-ID', { notation:'compact', compactDisplay:'short' }).format(n)
const fmtFull = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(n)
const cleanV  = v => (!v || String(v).trim().toLowerCase() === 'nan') ? 'No Status' : v

const HASIL_C = { fit: GREEN, unfit: RED }
const GENDER_C = { laki: NAVY, perempuan: RED, 'laki-laki': NAVY, l: NAVY, p: RED }

const CT = ({ active, payload, label, money=false }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      {label && <p style={{ fontWeight:600, color:NAVY, marginBottom:4 }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color||NAVY, margin:'2px 0' }}>
          {p.name}: <strong>{money ? fmtFull(p.value) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}
const CTMoney = props => <CT {...props} money/>

function MCU() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [options, setOptions]   = useState({ project:[] })
  const [topDivisi, setTopDivisi] = useState('5')
  const [filters, setFilters]   = useState({ project:'', hasil:'', gender:'', startMonth:'', endMonth:'' })

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (f.project)    p.append('project', f.project)
      if (f.hasil)      p.append('hasil', f.hasil)
      if (f.gender)     p.append('gender', f.gender)
      if (f.startMonth) p.append('start', `${f.startMonth}-01`)
      if (f.endMonth)   p.append('end',   `${f.endMonth}-01`)
      const res = await fetch(p.toString() ? `${API_URL}?${p}` : API_URL)
      if (!res.ok) throw new Error('Gagal mengambil data')
      setData(await res.json()); setError(null)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => {
    fetchData()
    fetch(API_URL).then(r => r.json()).then(j =>
      setOptions({ project: (j.project||[]).map(d => cleanV(d.project)) })
    ).catch(() => {})
  }, [])

  const setF  = (k,v) => setFilters(p => ({ ...p, [k]:v }))
  const apply = () => fetchData(filters)
  const reset = () => { const e={project:'',hasil:'',gender:'',startMonth:'',endMonth:''}; setFilters(e); fetchData(e) }

  if (loading) return <div className="mc-wrap"><div className="mc-loading"><div className="mc-spin"/><p>Memuat data...</p></div></div>
  if (error)   return <div className="mc-wrap"><div className="mc-err"><p>Gagal: {error}</p><button onClick={() => fetchData()}>Coba lagi</button></div></div>
  if (!data)   return null

  const { kpi, hasil_mcu, divisi, project, trend, gender, cost_project, cost_trend } = data

  const total    = kpi?.total_mcu || 0
  const fit      = kpi?.fit       || 0
  const unfit    = kpi?.unfit     || 0
  const fitRate  = kpi?.fit_rate  || 0
  const pctFit   = total ? Math.round(fit / total * 100) : 0
  const pctUnfit = total ? Math.round(unfit / total * 100) : 0

  // Clean & sort
  const hasilClean    = (hasil_mcu||[]).map(d => ({ ...d, hasil: cleanV(d.hasil) }))
  const divisiClean   = (divisi||[]).map(d => ({ ...d, divisi: cleanV(d.divisi) }))
  const projectClean  = (project||[]).map(d => ({ ...d, project: cleanV(d.project) }))
  const genderClean   = (gender||[]).map(d => ({ ...d, gender: cleanV(d.gender) }))
  const cpClean       = (cost_project||[]).map(d => ({ ...d, project: cleanV(d.project) }))

  const divisiSorted  = [...divisiClean].sort((a,b) => b.jumlah-a.jumlah)
  const divisiSliced  = topDivisi==='5' ? divisiSorted.slice(0,5) : topDivisi==='10' ? divisiSorted.slice(0,10) : divisiSorted

  const pieHasil   = hasilClean.map(d => ({ ...d, color: HASIL_C[d.hasil] || AMBER }))
  const pieGender  = genderClean.map((d,i) => ({ ...d, color: GENDER_C[d.gender.toLowerCase()] || [NAVY,RED,ORANGE][i%3] }))
  const cpSorted   = [...cpClean].sort((a,b) => b.pembayaran-a.pembayaran)

  return (
    <div className="mc-wrap">

      {/* FILTER */}
      <div className="mc-filter">
        <div className="mc-fi">
          <div className="mc-fg">
            <label className="mc-fl">Project</label>
            <select className="mc-fs" value={filters.project} onChange={e => setF('project', e.target.value)}>
              <option value="">Semua Project</option>
              {options.project.map((v,i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="mc-fd"/>
          <div className="mc-fg">
            <label className="mc-fl">Hasil MCU</label>
            <select className="mc-fs" value={filters.hasil} onChange={e => setF('hasil', e.target.value)}>
              <option value="">Semua</option>
              <option value="fit">Fit</option>
              <option value="unfit">Unfit</option>
            </select>
          </div>
          <div className="mc-fd"/>
          <div className="mc-fg">
            <label className="mc-fl">Gender</label>
            <select className="mc-fs" value={filters.gender} onChange={e => setF('gender', e.target.value)}>
              <option value="">Semua</option>
              <option value="l">Laki-laki</option>
              <option value="p">Perempuan</option>
            </select>
          </div>
          <div className="mc-fd"/>
          <div className="mc-fg">
            <label className="mc-fl">Periode Mulai</label>
            <input type="month" className="mc-fs" value={filters.startMonth} onChange={e => setF('startMonth', e.target.value)}/>
          </div>
          <div className="mc-fd"/>
          <div className="mc-fg">
            <label className="mc-fl">Periode Akhir</label>
            <input type="month" className="mc-fs" value={filters.endMonth} onChange={e => setF('endMonth', e.target.value)}/>
          </div>
        </div>
        <div className="mc-fa">
          <button className="mc-br" onClick={reset}>Reset</button>
          <button className="mc-ba" onClick={apply}>Terapkan</button>
        </div>
      </div>

      {/* KPI — 5 card */}
      <div className="mc-kpi5">
        {[
          { bg:'#e8e9f9', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="12" rx="1.5" stroke={NAVY} strokeWidth="1.8" fill="none"/><path d="M8 21h8M12 16v5" stroke={NAVY} strokeWidth="1.6" strokeLinecap="round"/></svg>, pct:'Total', pctC:NAVY, val:total, lbl:'Total MCU', bar:NAVY },
          { bg:'#dcfce7', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, pct:`${pctFit}%`, pctC:GREEN, val:fit, lbl:'Fit', bar:GREEN },
          { bg:'#f9e8e8', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={RED} strokeWidth="2" fill="none"/><path d="M15 9l-6 6M9 9l6 6" stroke={RED} strokeWidth="2" strokeLinecap="round"/></svg>, pct:`${pctUnfit}%`, pctC:RED, val:unfit, lbl:'Unfit', bar:RED },
          { bg:'#dcfce7', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 17l5-5 4 4 7-8" stroke={GREEN} strokeWidth="2.2" strokeLinecap="round" fill="none"/></svg>, pct:'rate', pctC:GREEN, val:`${fitRate}%`, lbl:'Fit Rate', bar:GREEN },
          { bg:'#f9e8e8', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="13" rx="2" fill={RED} opacity=".8"/><path d="M8 12h2M14 12h2M12 9v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>, pct:'biaya', pctC:RED, val:fmtFull(kpi?.total_cost||0), lbl:'Total Biaya MCU', bar:RED },
        ].map((c,i) => (
          <div key={i} className="mc-kcard">
            <div className="mc-ktop">
              <div className="mc-kico" style={{ background:c.bg }}>{c.icon}</div>
              <span className="mc-kpct" style={{ color:c.pctC }}>{c.pct}</span>
            </div>
            <p className="mc-kval">{c.val}</p>
            <p className="mc-klbl">{c.lbl}</p>
            <div className="mc-kbar" style={{ background:c.bar }}/>
          </div>
        ))}
      </div>

      {/* ROW 1: Pie hasil (35%) + Trend peserta (65%) */}
      <div className="mc-row2" style={{ gridTemplateColumns:'0.8fr 1.4fr' }}>

        <div className="mc-card">
          <p className="mc-ctitle">Hasil MCU</p>
          <p className="mc-cdesc">Komposisi Fit vs Unfit peserta MCU</p>
          {pieHasil.length === 0 ? <p className="mc-nodata">Tidak ada data</p> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieHasil} cx="50%" cy="50%"
                    innerRadius={52} outerRadius={78} paddingAngle={4} cornerRadius={4}
                    dataKey="jumlah" nameKey="hasil">
                    {pieHasil.map((d,i) => <Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip content={<CT/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="mc-leg">
                {pieHasil.map((d,i) => (
                  <div key={i} className="mc-litem">
                    <span className="mc-lleft"><span className="mc-ldot" style={{ background:d.color }}/><span className="mc-lname" style={{ textTransform:'capitalize' }}>{d.hasil}</span></span>
                    <span className="mc-lval">{d.jumlah}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="mc-card">
          <p className="mc-ctitle">Tren Peserta MCU per Bulan</p>
          <p className="mc-cdesc">Jumlah karyawan yang mengikuti MCU setiap bulan</p>
          {(trend||[]).length === 0 ? <p className="mc-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend} margin={{ top:8, right:16, left:0, bottom:40 }}>
                <defs>
                  <linearGradient id="gMcTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={NAVY} stopOpacity={0.18}/><stop offset="100%" stopColor={NAVY} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
                <XAxis dataKey="bulan" tick={{ fontSize:11, fill:'#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Area type="monotone" dataKey="jumlah" name="Peserta" stroke={NAVY} strokeWidth={2} fill="url(#gMcTrend)" dot={{ r:3, fill:NAVY, strokeWidth:0 }} activeDot={{ r:5 }}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* ROW 2: Distribusi divisi (hbar, toggle) + Gender (donut) */}
      <div className="mc-row2" style={{ gridTemplateColumns:'1.4fr 0.8fr' }}>

        <div className="mc-card">
          <div className="mc-card-header">
            <div>
              <p className="mc-ctitle">Peserta MCU per Divisi</p>
              <p className="mc-cdesc">Jumlah peserta MCU di setiap divisi</p>
            </div>
            <div className="mc-top-toggle">
              {['5','10','all'].map(v => (
                <button key={v} className={`mc-top-btn${topDivisi===v?' mc-top-btn--active':''}`}
                  onClick={() => setTopDivisi(v)}>
                  {v==='all'?'All':`Top ${v}`}
                </button>
              ))}
            </div>
          </div>
          {divisiSliced.length === 0 ? <p className="mc-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={Math.max(200, divisiSliced.length*34)}>
              <BarChart data={divisiSliced} layout="vertical" barCategoryGap="25%"
                margin={{ top:0, right:50, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="divisi" tick={{ fontSize:11, fill:'#444' }} width={120} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Bar dataKey="jumlah" name="Peserta" fill={NAVY} radius={[0,4,4,0]} maxBarSize={22}
                  label={{ position:'right', fontSize:11, fill:NAVY, fontWeight:600 }}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mc-card">
          <p className="mc-ctitle">Distribusi Gender</p>
          <p className="mc-cdesc">Komposisi peserta MCU berdasarkan jenis kelamin</p>
          {pieGender.length === 0 ? <p className="mc-nodata">Tidak ada data</p> : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieGender} cx="50%" cy="50%"
                    innerRadius={52} outerRadius={78} paddingAngle={4} cornerRadius={4}
                    dataKey="jumlah" nameKey="gender">
                    {pieGender.map((d,i) => <Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip content={<CT/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="mc-leg">
                {pieGender.map((d,i) => (
                  <div key={i} className="mc-litem">
                    <span className="mc-lleft"><span className="mc-ldot" style={{ background:d.color }}/><span className="mc-lname" style={{ textTransform:'capitalize' }}>{d.gender}</span></span>
                    <span className="mc-lval">{d.jumlah}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* ROW 3: Biaya per project (hbar) + Trend biaya (area) */}
      <div className="mc-row2" style={{ gridTemplateColumns:'1fr 1.2fr' }}>

        <div className="mc-card">
          <p className="mc-ctitle">Biaya MCU per Project</p>
          <p className="mc-cdesc">Total biaya MCU yang dikeluarkan per project</p>
          {cpSorted.length === 0 ? <p className="mc-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={Math.max(200, cpSorted.length*34)}>
              <BarChart data={cpSorted} layout="vertical" barCategoryGap="28%"
                margin={{ top:0, right:20, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:11, fill:'#888' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="project" tick={{ fontSize:11, fill:'#444' }} width={120} axisLine={false} tickLine={false}/>
                <Tooltip content={<CTMoney/>}/>
                <Bar dataKey="pembayaran" name="Biaya" fill={RED} radius={[0,4,4,0]} maxBarSize={22}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mc-card">
          <p className="mc-ctitle">Tren Biaya MCU per Periode</p>
          <p className="mc-cdesc">Total biaya MCU yang dikeluarkan setiap periode</p>
          {(cost_trend||[]).length === 0 ? <p className="mc-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={cost_trend} margin={{ top:8, right:16, left:10, bottom:40 }}>
                <defs>
                  <linearGradient id="gMcCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={RED} stopOpacity={0.18}/><stop offset="100%" stopColor={RED} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
                <XAxis dataKey="periode" tick={{ fontSize:11, fill:'#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'#888' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
                <Tooltip content={<CTMoney/>}/>
                <Area type="monotone" dataKey="pembayaran" name="Biaya MCU" stroke={RED} strokeWidth={2} fill="url(#gMcCost)" dot={{ r:3, fill:RED, strokeWidth:0 }} activeDot={{ r:5 }}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

    </div>
  )
}

export default memo(MCU)
