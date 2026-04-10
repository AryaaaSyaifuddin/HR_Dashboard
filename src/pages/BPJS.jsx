import { useState, useEffect, useCallback, memo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './BPJS.css'

const API_URL = 'http://127.0.0.1:5000/bpjs/dashboard'
const NAVY = '#060771', RED = '#BF1A1A', GREEN = '#16a34a', ORANGE = '#ea580c', AMBER = '#b45309'

const fmt     = n => new Intl.NumberFormat('id-ID', { notation:'compact', compactDisplay:'short' }).format(n)
const fmtFull = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(n)

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
const CTMoney = (props) => <CT {...props} money/>

function BPJS() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [options, setOptions] = useState({ project:[], jenis_bpjs:[], periode:[] })
  const [filters, setFilters] = useState({ project:'', jenis_bpjs:'', periode:'' })

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (f.project)   p.append('project', f.project)
      if (f.jenis_bpjs) p.append('jenis_bpjs', f.jenis_bpjs)
      if (f.periode)   p.append('periode', f.periode)
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
        project:   (j.project||[]).map(d => d.project),
        jenis_bpjs:(j.jenis||[]).map(d => d.jenis_bpjs),
        periode:   [...new Set([
          ...(j.kesehatan_trend||[]).map(d => d.periode),
          ...(j.tk_trend||[]).map(d => d.periode)
        ])].sort()
      })
    }).catch(() => {})
  }, [])

  const setF  = (k,v) => setFilters(p => ({ ...p, [k]:v }))
  const apply = () => fetchData(filters)
  const reset = () => { const e={project:'',jenis_bpjs:'',periode:''}; setFilters(e); fetchData(e) }

  if (loading) return <div className="bp-wrap"><div className="bp-loading"><div className="bp-spin"/><p>Memuat data...</p></div></div>
  if (error)   return <div className="bp-wrap"><div className="bp-err"><p>Gagal: {error}</p><button onClick={() => fetchData()}>Coba lagi</button></div></div>
  if (!data)   return null

  const { kpi, jenis, project, kesehatan_trend, tk_trend, total_trend } = data

  // Gabung kesehatan & TK per periode untuk composed chart
  const trendMap = {}
  ;(kesehatan_trend||[]).forEach(d => { trendMap[d.periode] = { periode:d.periode, kesehatan:d.pembayaran, tk:0 } })
  ;(tk_trend||[]).forEach(d => {
    if (trendMap[d.periode]) trendMap[d.periode].tk = d.pembayaran
    else trendMap[d.periode] = { periode:d.periode, kesehatan:0, tk:d.pembayaran }
  })
  const combinedTrend = Object.values(trendMap).sort((a,b) => a.periode.localeCompare(b.periode))

  const pieJenis = (jenis||[]).map((d,i) => ({ ...d, color: i===0?NAVY:RED }))
  const projectSorted = [...(project||[])].sort((a,b) => b.jumlah-a.jumlah)

  return (
    <div className="bp-wrap">

      {/* FILTER */}
      <div className="bp-filter">
        <div className="bp-fi">
          <div className="bp-fg">
            <label className="bp-fl">Project</label>
            <select className="bp-fs" value={filters.project} onChange={e => setF('project', e.target.value)}>
              <option value="">Semua Project</option>
              {options.project.map((v,i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="bp-fd"/>
          <div className="bp-fg">
            <label className="bp-fl">Jenis BPJS</label>
            <select className="bp-fs" value={filters.jenis_bpjs} onChange={e => setF('jenis_bpjs', e.target.value)}>
              <option value="">Semua Jenis</option>
              <option value="kesehatan">Kesehatan</option>
              <option value="tk">Ketenagakerjaan</option>
            </select>
          </div>
          <div className="bp-fd"/>
          <div className="bp-fg">
            <label className="bp-fl">Periode</label>
            <select className="bp-fs" value={filters.periode} onChange={e => setF('periode', e.target.value)}>
              <option value="">Semua Periode</option>
              {options.periode.map((v,i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="bp-fa">
          <button className="bp-br" onClick={reset}>Reset</button>
          <button className="bp-ba" onClick={apply}>Terapkan</button>
        </div>
      </div>

      {/* KPI — 4 card, 2 kiri besar (nominal), 2 kanan kecil (info) */}
      <div className="bp-kpi-layout">

        <div className="bp-kcard bp-kcard--big">
          <div className="bp-kico" style={{ background:'#e8e9f9' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="13" rx="2" fill={NAVY} opacity=".8"/>
              <path d="M8 12h2M14 12h2M12 9v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="bp-klbl">Total BPJS Dibayar</p>
          <p className="bp-kval-big">{fmtFull(kpi?.total_semua || 0)}</p>
          <div className="bp-kbar" style={{ background:NAVY }}/>
        </div>

        <div className="bp-kcard bp-kcard--big">
          <div className="bp-kico" style={{ background:'#dcfce7' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 3l6 3v5c0 4-2.5 7-6 8.5C8.5 18 6 15 6 11V6l6-3z" fill={GREEN} opacity=".8"/>
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="bp-klbl">BPJS Kesehatan</p>
          <p className="bp-kval-big" style={{ color:GREEN }}>{fmtFull(kpi?.total_kesehatan || 0)}</p>
          <div className="bp-kbar" style={{ background:GREEN }}/>
        </div>

        <div className="bp-kcard">
          <div className="bp-kico-sm" style={{ background:'#fff3e0' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="6" width="18" height="13" rx="2" fill={ORANGE} opacity=".8"/>
              <path d="M8 6V5a4 4 0 018 0v1" fill={ORANGE}/>
            </svg>
          </div>
          <p className="bp-klbl">BPJS TK</p>
          <p className="bp-kval-med" style={{ color:ORANGE }}>{fmtFull(kpi?.total_tk || 0)}</p>
          <div className="bp-kbar" style={{ background:ORANGE }}/>
        </div>

        <div className="bp-kcard">
          <div className="bp-kico-sm" style={{ background:'#e8e9f9' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="7" r="4" fill={NAVY}/>
              <circle cx="17" cy="7" r="3" fill={NAVY} opacity=".4"/>
              <path d="M1 20c0-4 3.6-7 8-7s8 3 8 7" fill={NAVY} opacity=".3"/>
            </svg>
          </div>
          <p className="bp-klbl">Total Karyawan</p>
          <p className="bp-kval-med">{kpi?.total_karyawan || 0} <span style={{ fontSize:12, fontWeight:400, color:'#888' }}>orang</span></p>
          <div className="bp-kbar" style={{ background:NAVY }}/>
        </div>

      </div>

      {/* HERO: Composed — kesehatan bar + TK line per periode */}
      <div className="bp-card">
        <p className="bp-ctitle">Tren Pembayaran BPJS per Periode</p>
        <p className="bp-cdesc">Perbandingan pembayaran BPJS Kesehatan dan Ketenagakerjaan tiap periode</p>
        {combinedTrend.length === 0 ? <p className="bp-nodata">Tidak ada data</p> : (
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={combinedTrend} margin={{ top:8, right:20, left:20, bottom:40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
              <XAxis dataKey="periode" tick={{ fontSize:11, fill:'#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="kes" tick={{ fontSize:10, fill:'#888' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="tk" orientation="right" tick={{ fontSize:10, fill:'#888' }} tickFormatter={v => fmt(v)} axisLine={false} tickLine={false}/>
              <Tooltip content={<CTMoney/>}/>
              <Legend wrapperStyle={{ fontSize:12 }}/>
              <Bar yAxisId="kes" dataKey="kesehatan" name="Kesehatan" fill={GREEN} radius={[4,4,0,0]} maxBarSize={30} fillOpacity={0.85}/>
              <Line yAxisId="tk" dataKey="tk" name="TK" type="monotone" stroke={ORANGE} strokeWidth={2.5} dot={{ r:4, fill:ORANGE, strokeWidth:0 }} activeDot={{ r:6 }}/>
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ROW 2: Bar project (60%) + Donut jenis (40%) */}
      <div className="bp-row2" style={{ gridTemplateColumns:'1.4fr 1fr' }}>

        <div className="bp-card">
          <p className="bp-ctitle">Peserta BPJS per Project</p>
          <p className="bp-cdesc">Jumlah karyawan terdaftar BPJS di setiap project</p>
          {projectSorted.length === 0 ? <p className="bp-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={Math.max(200, projectSorted.length*34)}>
              <BarChart data={projectSorted} layout="vertical" barCategoryGap="28%"
                margin={{ top:0, right:50, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="project" tick={{ fontSize:11, fill:'#444' }} width={110} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Bar dataKey="jumlah" name="Peserta" fill={NAVY} radius={[0,4,4,0]} maxBarSize={20}
                  label={{ position:'right', fontSize:11, fill:NAVY, fontWeight:600 }}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bp-card">
          <p className="bp-ctitle">Komposisi Jenis BPJS</p>
          <p className="bp-cdesc">Distribusi karyawan berdasarkan jenis BPJS yang dimiliki</p>
          {pieJenis.length === 0 ? <p className="bp-nodata">Tidak ada data</p> : (
            <>
              <ResponsiveContainer width="100%" height={175}>
                <PieChart>
                  <Pie data={pieJenis} cx="50%" cy="50%"
                    innerRadius={52} outerRadius={78} paddingAngle={4} cornerRadius={4}
                    dataKey="jumlah" nameKey="jenis_bpjs">
                    {pieJenis.map((d,i) => <Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip content={<CT/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="bp-leg">
                {pieJenis.map((d,i) => (
                  <div key={i} className="bp-litem">
                    <span className="bp-lleft">
                      <span className="bp-ldot" style={{ background:d.color }}/>
                      <span className="bp-lname" style={{ textTransform:'capitalize' }}>{d.jenis_bpjs}</span>
                    </span>
                    <span className="bp-lval">{d.jumlah}</span>
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

export default memo(BPJS)
