import { useState, useEffect, memo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './Overtime.css'

const API_URL = 'http://127.0.0.1:5000/overtime/dashboard'
const NAVY = '#060771', RED = '#BF1A1A', GREEN = '#16a34a', ORANGE = '#ea580c', AMBER = '#b45309'

const fmt     = n => new Intl.NumberFormat('id-ID', { notation:'compact', compactDisplay:'short' }).format(n)
const fmtFull = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(n)
const fmtDec  = n => Number(n).toFixed(1)

const CT = ({ active, payload, label, money=false }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      {label && <p style={{ fontWeight:600, color:NAVY, marginBottom:4 }}>{label}</p>}
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color||NAVY, margin:'2px 0' }}>
          {p.name}: <strong>{money ? fmtFull(p.value) : fmtDec(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}
const CTMoney = (props) => <CT {...props} money/>

function Overtime() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  // Overtime tidak punya filter di backend, langsung fetch
  const fetchData = () => {
    setLoading(true)
    fetch(API_URL)
      .then(r => { if (!r.ok) throw new Error('Gagal mengambil data'); return r.json() })
      .then(j => { setData(j); setError(null) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <div className="ot-wrap"><div className="ot-loading"><div className="ot-spin"/><p>Memuat data...</p></div></div>
  if (error)   return <div className="ot-wrap"><div className="ot-err"><p>Gagal: {error}</p><button onClick={fetchData}>Coba lagi</button></div></div>
  if (!data)   return null

  const { kpi, overtime_trend, absensi_trend, overtime_project, overtime_cost, top_project } = data

  // Gabung overtime trend + cost untuk composed chart
  const trendMap = {}
  ;(overtime_trend||[]).forEach(d => { trendMap[d.bulan] = { bulan:d.bulan, overtime:d.overtime, cost:0 } })
  ;(overtime_cost||[]).forEach(d => {
    if (trendMap[d.bulan]) trendMap[d.bulan].cost = d.overtime_cost
    else trendMap[d.bulan] = { bulan:d.bulan, overtime:0, cost:d.overtime_cost }
  })
  const combinedTrend = Object.values(trendMap).sort((a,b) => a.bulan.localeCompare(b.bulan))

  const projectSorted = [...(overtime_project||[])].sort((a,b) => b.overtime-a.overtime)

  return (
    <div className="ot-wrap">

      {/* INFO: tidak ada filter di backend */}
      <div className="ot-info-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={NAVY} strokeWidth="1.8" fill="none"/>
          <path d="M12 8v4M12 16h.01" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <span>Data menampilkan seluruh periode yang tersedia</span>
      </div>

      {/* KPI — 4 card, 2 baris berbeda karakter: jam vs biaya */}
      <div className="ot-kpi-grid">

        {/* Baris 1: metrik jam */}
        <div className="ot-kcard ot-kcard--jam">
          <div className="ot-kico" style={{ background:'#e8e9f9' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke={NAVY} strokeWidth="2" fill="none"/>
              <path d="M12 7v5l3 3" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="ot-klbl">Rata-rata Overtime</p>
            <p className="ot-kval">{fmtDec(kpi?.avg_overtime || 0)} <span className="ot-kunit">jam/bulan</span></p>
          </div>
          <div className="ot-kbar" style={{ background:NAVY }}/>
        </div>

        <div className="ot-kcard ot-kcard--jam">
          <div className="ot-kico" style={{ background:'#fef3c7' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke={AMBER} strokeWidth="1.8" fill="none"/>
              <path d="M3 9h18" stroke={AMBER} strokeWidth="1.5"/>
              <path d="M8 2v3M16 2v3" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M8 14h2M12 14h2" stroke={AMBER} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="ot-klbl">Rata-rata Absensi</p>
            <p className="ot-kval">{fmtDec(kpi?.avg_absensi || 0)} <span className="ot-kunit">hari/bulan</span></p>
          </div>
          <div className="ot-kbar" style={{ background:AMBER }}/>
        </div>

        {/* Baris 2: metrik biaya */}
        <div className="ot-kcard ot-kcard--cost">
          <div className="ot-kico" style={{ background:'#f9e8e8' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="13" rx="2" fill={RED} opacity=".8"/>
              <path d="M8 12h2M14 12h2M12 9v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <p className="ot-klbl">Total Cost</p>
            <p className="ot-kval ot-kval--money">{fmtFull(kpi?.total_cost || 0)}</p>
          </div>
          <div className="ot-kbar" style={{ background:RED }}/>
        </div>

        <div className="ot-kcard ot-kcard--cost">
          <div className="ot-kico" style={{ background:'#fff3e0' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 17l5-5 4 4 7-8" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <div>
            <p className="ot-klbl">Overtime Cost</p>
            <p className="ot-kval ot-kval--money" style={{ color:ORANGE }}>{fmtFull(kpi?.overtime_cost || 0)}</p>
          </div>
          <div className="ot-kbar" style={{ background:ORANGE }}/>
        </div>

      </div>

      {/* HERO: Composed — bar overtime + line cost per bulan */}
      <div className="ot-card">
        <p className="ot-ctitle">Tren Overtime & Biaya per Bulan</p>
        <p className="ot-cdesc">Rata-rata jam lembur (batang) dibandingkan dengan biaya overtime (garis) tiap bulan</p>
        {combinedTrend.length === 0 ? <p className="ot-nodata">Tidak ada data</p> : (
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={combinedTrend} margin={{ top:8, right:24, left:10, bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
              <XAxis dataKey="bulan" tick={{ fontSize:11, fill:'#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="ot" tick={{ fontSize:10, fill:'#888' }} axisLine={false} tickLine={false}
                label={{ value:'Jam', angle:-90, position:'insideLeft', fontSize:10, fill:'#aaa' }}/>
              <YAxis yAxisId="cost" orientation="right" tick={{ fontSize:10, fill:'#888' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Legend wrapperStyle={{ fontSize:12 }}/>
              <Bar yAxisId="ot" dataKey="overtime" name="Rata-rata OT (jam)" fill={NAVY} radius={[4,4,0,0]} maxBarSize={32} fillOpacity={0.85}/>
              <Line yAxisId="cost" dataKey="cost" name="Biaya OT" type="monotone" stroke={RED} strokeWidth={2.5} dot={{ r:4, fill:RED, strokeWidth:0 }} activeDot={{ r:6 }}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ROW 2: Bar per project (55%) + Line absensi (45%) */}
      <div className="ot-row2" style={{ gridTemplateColumns:'1.2fr 1fr' }}>

        <div className="ot-card">
          <p className="ot-ctitle">Rata-rata Overtime per Project</p>
          <p className="ot-cdesc">Project dengan jam lembur rata-rata tertinggi</p>
          {projectSorted.length === 0 ? <p className="ot-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={Math.max(200, projectSorted.length*36)}>
              <BarChart data={projectSorted} layout="vertical" barCategoryGap="28%"
                margin={{ top:0, right:60, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="project" tick={{ fontSize:11, fill:'#444' }} width={120} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Bar dataKey="overtime" name="OT (jam)" fill={NAVY} radius={[0,4,4,0]} maxBarSize={20}
                  label={{ position:'right', fontSize:11, fill:NAVY, fontWeight:600, formatter: v => fmtDec(v) }}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="ot-card">
          <p className="ot-ctitle">Tren Absensi per Bulan</p>
          <p className="ot-cdesc">Rata-rata hari absensi karyawan setiap bulan</p>
          {(absensi_trend||[]).length === 0 ? <p className="ot-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={absensi_trend} margin={{ top:8, right:16, left:0, bottom:40 }}>
                <defs>
                  <linearGradient id="gOtAbs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={AMBER} stopOpacity={0.2}/>
                    <stop offset="100%" stopColor={AMBER} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
                <XAxis dataKey="bulan" tick={{ fontSize:11, fill:'#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Area type="monotone" dataKey="absensi" name="Absensi (hari)" stroke={AMBER} strokeWidth={2}
                  fill="url(#gOtAbs)" dot={{ r:3, fill:AMBER, strokeWidth:0 }} activeDot={{ r:5 }}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* TOP PROJECT: bar cost terbesar */}
      {(top_project||[]).length > 0 && (
        <div className="ot-card">
          <p className="ot-ctitle">Top 5 Project — Overtime Tertinggi</p>
          <p className="ot-cdesc">Project dengan rata-rata jam lembur tertinggi</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={top_project} barCategoryGap="35%"
              margin={{ top:4, right:16, left:0, bottom:50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
              <XAxis dataKey="project" tick={{ fontSize:11, fill:'#888' }} angle={-25} textAnchor="end" height={60} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="overtime" name="OT (jam)" fill={RED} radius={[4,4,0,0]} maxBarSize={40}
                label={{ position:'top', fontSize:11, fill:RED, fontWeight:600, formatter: v => fmtDec(v) }}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  )
}

export default memo(Overtime)
