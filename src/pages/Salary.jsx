import { useState, useEffect, useCallback, memo } from 'react'
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './Salary.css'

const API_URL = 'http://127.0.0.1:5000/salary/dashboard'
const NAVY = '#060771', RED = '#BF1A1A', GREEN = '#16a34a', ORANGE = '#ea580c'

const fmt = (n) => new Intl.NumberFormat('id-ID', { notation:'compact', compactDisplay:'short' }).format(n)
const fmtFull = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n)

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      {label && <p style={{ fontWeight:600, color:NAVY, marginBottom:4 }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color||NAVY, margin:'2px 0' }}>
          {p.name}: <strong>{fmtFull(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}

function Salary() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [options, setOptions] = useState({ project:[], periode:[] })
  const [filters, setFilters] = useState({ project:'', periode:'' })

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (f.project) p.append('project', f.project)
      if (f.periode) p.append('periode', f.periode)
      const res = await fetch(p.toString() ? `${API_URL}?${p}` : API_URL)
      if (!res.ok) throw new Error('Gagal mengambil data')
      setData(await res.json()); setError(null)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => {
    fetchData()
    fetch(API_URL).then(r => r.json()).then(j => {
      setOptions({
        project: [...new Set([...(j.gaji_project||[]).map(d => d.project)])],
        periode: [...new Set([...(j.gaji_trend||[]).map(d => d.periode)])].sort()
      })
    }).catch(() => {})
  }, [])

  const setF  = (k,v) => setFilters(p => ({ ...p, [k]:v }))
  const apply = () => fetchData(filters)
  const reset = () => { const e={project:'',periode:''}; setFilters(e); fetchData(e) }

  if (loading) return <div className="sl-wrap"><div className="sl-loading"><div className="sl-spin"/><p>Memuat data...</p></div></div>
  if (error)   return <div className="sl-wrap"><div className="sl-err"><p>Gagal: {error}</p><button onClick={() => fetchData()}>Coba lagi</button></div></div>
  if (!data)   return null

  const { kpi, gaji_project, gaji_trend, pph_project, pph_trend } = data

  // Gabung gaji & pph trend untuk composed chart
  const trendMap = {}
  ;(gaji_trend||[]).forEach(d => { trendMap[d.periode] = { periode: d.periode, gaji: d.gaji, pph21: 0 } })
  ;(pph_trend||[]).forEach(d => {
    if (trendMap[d.periode]) trendMap[d.periode].pph21 = d.pph21
    else trendMap[d.periode] = { periode: d.periode, gaji: 0, pph21: d.pph21 }
  })
  const combinedTrend = Object.values(trendMap).sort((a,b) => a.periode.localeCompare(b.periode))

  // Gabung gaji & pph per project
  const projectMap = {}
  ;(gaji_project||[]).forEach(d => { projectMap[d.project] = { project: d.project, gaji: d.gaji, pph21: 0 } })
  ;(pph_project||[]).forEach(d => {
    if (projectMap[d.project]) projectMap[d.project].pph21 = d.pph21
    else projectMap[d.project] = { project: d.project, gaji: 0, pph21: d.pph21 }
  })
  const combinedProject = Object.values(projectMap).sort((a,b) => b.gaji - a.gaji)

  return (
    <div className="sl-wrap">

      {/* FILTER */}
      <div className="sl-filter">
        <div className="sl-fi">
          <div className="sl-fg">
            <label className="sl-fl">Project</label>
            <select className="sl-fs" value={filters.project} onChange={e => setF('project', e.target.value)}>
              <option value="">Semua Project</option>
              {options.project.map((v,i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="sl-fd"/>
          <div className="sl-fg">
            <label className="sl-fl">Periode</label>
            <select className="sl-fs" value={filters.periode} onChange={e => setF('periode', e.target.value)}>
              <option value="">Semua Periode</option>
              {options.periode.map((v,i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="sl-fa">
          <button className="sl-br" onClick={reset}>Reset</button>
          <button className="sl-ba" onClick={apply}>Terapkan</button>
        </div>
      </div>

      {/* KPI — 3 card besar, angka keuangan */}
      <div className="sl-kpi3">
        <div className="sl-kcard sl-kcard--main">
          <div className="sl-kico-wrap">
            <div className="sl-kico" style={{ background:'#e8e9f9' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="13" rx="2" fill={NAVY} opacity=".8"/>
                <path d="M8 12h2M14 12h2M12 9v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <p className="sl-klbl">Total Gaji Dibayarkan</p>
          <p className="sl-kval-big">{fmtFull(kpi?.total_gaji || 0)}</p>
          <div className="sl-kbar" style={{ background:NAVY }}/>
        </div>

        <div className="sl-kcard sl-kcard--main">
          <div className="sl-kico-wrap">
            <div className="sl-kico" style={{ background:'#f9e8e8' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l6 3v5c0 4-2.5 7-6 8.5C8.5 18 6 15 6 11V6l6-3z" fill={RED} opacity=".8"/>
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <p className="sl-klbl">Total PPH21 Dipotong</p>
          <p className="sl-kval-big" style={{ color:RED }}>{fmtFull(kpi?.total_pph21 || 0)}</p>
          <div className="sl-kbar" style={{ background:RED }}/>
        </div>

        <div className="sl-kcard">
          <div className="sl-kico-wrap">
            <div className="sl-kico" style={{ background:'#dcfce7' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="8" height="8" rx="1.5" fill={GREEN} opacity=".8"/>
                <rect x="13" y="3" width="8" height="8" rx="1.5" fill={GREEN} opacity=".5"/>
                <rect x="3" y="13" width="8" height="8" rx="1.5" fill={GREEN} opacity=".5"/>
                <rect x="13" y="13" width="8" height="8" rx="1.5" fill={GREEN} opacity=".3"/>
              </svg>
            </div>
          </div>
          <p className="sl-klbl">Jumlah Project</p>
          <p className="sl-kval-big" style={{ color:GREEN }}>{kpi?.jumlah_project || 0}</p>
          <div className="sl-kbar" style={{ background:GREEN }}/>
        </div>
      </div>

      {/* HERO: Composed chart gaji vs PPH21 per bulan — FULL WIDTH */}
      <div className="sl-card">
        <p className="sl-ctitle">Tren Gaji & PPH21 per Periode</p>
        <p className="sl-cdesc">Perbandingan total gaji yang dibayarkan vs PPH21 yang dipotong tiap periode</p>
        {combinedTrend.length === 0 ? <p className="sl-nodata">Tidak ada data</p> : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={combinedTrend} margin={{ top:8, right:16, left:20, bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
              <XAxis dataKey="periode" tick={{ fontSize:11, fill:'#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="gaji" tick={{ fontSize:10, fill:'#888' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="pph" orientation="right" tick={{ fontSize:10, fill:'#888' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Legend wrapperStyle={{ fontSize:12 }}/>
              <Bar yAxisId="gaji" dataKey="gaji" name="Gaji" fill={NAVY} radius={[4,4,0,0]} maxBarSize={32} fillOpacity={0.85}/>
              <Line yAxisId="pph" dataKey="pph21" name="PPH21" type="monotone" stroke={RED} strokeWidth={2.5} dot={{ r:4, fill:RED, strokeWidth:0 }} activeDot={{ r:6 }}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ROW 2: Bar grouped gaji+pph per project — FULL WIDTH */}
      <div className="sl-card">
        <p className="sl-ctitle">Gaji & PPH21 per Project</p>
        <p className="sl-cdesc">Perbandingan beban gaji dan potongan pajak di setiap project</p>
        {combinedProject.length === 0 ? <p className="sl-nodata">Tidak ada data</p> : (
          <ResponsiveContainer width="100%" height={Math.max(240, combinedProject.length * 38)}>
            <BarChart data={combinedProject} layout="vertical" barCategoryGap="28%"
              margin={{ top:0, right:20, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false}/>
              <XAxis type="number" tick={{ fontSize:11, fill:'#888' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="project" tick={{ fontSize:11, fill:'#444' }} width={120} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Legend wrapperStyle={{ fontSize:12 }}/>
              <Bar dataKey="gaji" name="Gaji" fill={NAVY} radius={[0,3,3,0]} maxBarSize={16}/>
              <Bar dataKey="pph21" name="PPH21" fill={RED} radius={[0,3,3,0]} maxBarSize={16}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ROW 3: Trend gaji (55%) + Trend PPH (45%) terpisah */}
      <div className="sl-row2">
        <div className="sl-card">
          <p className="sl-ctitle">Tren Gaji per Periode</p>
          <p className="sl-cdesc">Naik turun total gaji yang dibayarkan</p>
          {(gaji_trend||[]).length === 0 ? <p className="sl-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={gaji_trend} margin={{ top:8, right:16, left:10, bottom:40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
                <XAxis dataKey="periode" tick={{ fontSize:10, fill:'#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'#888' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Line type="monotone" dataKey="gaji" name="Gaji" stroke={NAVY} strokeWidth={2.5}
                  dot={{ r:4, fill:NAVY, strokeWidth:0 }} activeDot={{ r:6 }}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="sl-card">
          <p className="sl-ctitle">Tren PPH21 per Periode</p>
          <p className="sl-cdesc">Naik turun total potongan pajak</p>
          {(pph_trend||[]).length === 0 ? <p className="sl-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={pph_trend} margin={{ top:8, right:16, left:10, bottom:40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
                <XAxis dataKey="periode" tick={{ fontSize:10, fill:'#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:10, fill:'#888' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Line type="monotone" dataKey="pph21" name="PPH21" stroke={RED} strokeWidth={2.5}
                  dot={{ r:4, fill:RED, strokeWidth:0 }} activeDot={{ r:6 }}/>
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  )
}

export default memo(Salary)
