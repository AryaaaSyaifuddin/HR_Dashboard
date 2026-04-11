import { useState, useEffect, useCallback, memo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import './Training.css'

const API_URL = 'http://127.0.0.1:5000/training/dashboard'
const NAVY = '#060771', RED = '#BF1A1A', GREEN = '#16a34a'
const ORANGE = '#ea580c', AMBER = '#b45309'

const STATUS_C = { done: GREEN, 'in progress': NAVY, cancel: RED }

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      {label && <p style={{ fontWeight:600, color:NAVY, marginBottom:4 }}>{label}</p>}
      {payload.map((p,i) => <p key={i} style={{ color:p.color||NAVY, margin:'2px 0' }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  )
}

function Training() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [options, setOptions] = useState({ divisi:[] })
  const [filters, setFilters] = useState({ jenis:'', divisi:'', status:'', startMonth:'', endMonth:'' })

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (f.jenis)      p.append('jenis', f.jenis)
      if (f.divisi)     p.append('divisi', f.divisi)
      if (f.status)     p.append('status', f.status)
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
      setOptions({ divisi: (j.divisi||[]).map(d => d.divisi) })
    ).catch(() => {})
  }, [])

  const setF  = (k,v) => setFilters(p => ({ ...p, [k]:v }))
  const apply = () => fetchData(filters)
  const reset = () => { const e={jenis:'',divisi:'',status:'',startMonth:'',endMonth:''}; setFilters(e); fetchData(e) }

  if (loading) return <div className="tr-wrap"><div className="tr-loading"><div className="tr-spin"/><p>Memuat data...</p></div></div>
  if (error)   return <div className="tr-wrap"><div className="tr-err"><p>Gagal: {error}</p><button onClick={() => fetchData()}>Coba lagi</button></div></div>
  if (!data)   return null

  const { kpi, jenis, divisi, pelatihan, status, trend } = data
  const total     = kpi?.total      || 0
  const pctInt    = total ? Math.round(kpi.internal    / total * 100) : 0
  const pctExt    = total ? Math.round(kpi.external    / total * 100) : 0
  const pctDone   = total ? Math.round(kpi.done        / total * 100) : 0
  const pctInProg = total ? Math.round(kpi.in_progress / total * 100) : 0
  const pctCancel = total ? Math.round(kpi.cancel      / total * 100) : 0

  const pieJenis  = (jenis ||[]).map((d,i) => ({ ...d, color: i===0?NAVY:RED }))
  const pieStatus = (status||[]).map(d => ({ ...d, color: STATUS_C[d.status]||AMBER }))
  const divisiS   = [...(divisi   ||[])].sort((a,b) => b.jumlah-a.jumlah)
  const pelatihanS= [...(pelatihan||[])].sort((a,b) => b.jumlah-a.jumlah)

  const kpiRows = [
    [
      { bg:'#e8e9f9', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="12" rx="1.5" stroke={NAVY} strokeWidth="1.8" fill="none"/><path d="M8 21h8M12 16v5" stroke={NAVY} strokeWidth="1.6" strokeLinecap="round"/></svg>, pct:'Total', pctC:NAVY, val:total, lbl:'Total Pelatihan', bar:NAVY },
      { bg:'#e8e9f9', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l6 3v5c0 4-2.5 7-6 8.5C8.5 18 6 15 6 11V6l6-3z" fill={NAVY} opacity=".8"/></svg>, pct:`${pctInt}%`, pctC:NAVY, val:kpi.internal||0, lbl:'Internal', bar:NAVY },
      { bg:'#f9e8e8', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={RED} strokeWidth="2" fill="none"/><path d="M12 8v4M12 16h.01" stroke={RED} strokeWidth="2" strokeLinecap="round"/></svg>, pct:`${pctExt}%`, pctC:RED, val:kpi.external||0, lbl:'External', bar:RED },
    ],
    [
      { bg:'#dcfce7', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, pct:`${pctDone}%`, pctC:GREEN, val:kpi.done||0, lbl:'Done', bar:GREEN },
      { bg:'#fff3e0', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={ORANGE} strokeWidth="2" fill="none"/><path d="M12 7v5l3 3" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/></svg>, pct:`${pctInProg}%`, pctC:ORANGE, val:kpi.in_progress||0, lbl:'In Progress', bar:ORANGE },
      { bg:'#fef3c7', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke={AMBER} strokeWidth="2" fill="none"/><path d="M15 9l-6 6M9 9l6 6" stroke={AMBER} strokeWidth="2" strokeLinecap="round"/></svg>, pct:`${pctCancel}%`, pctC:AMBER, val:kpi.cancel||0, lbl:'Cancel', bar:AMBER },
    ],
  ]

  return (
    <div className="tr-wrap">

      {/* FILTER */}
      <div className="tr-filter">
        <div className="tr-fi">
          {[
            { key:'jenis', label:'Jenis', opts:[{v:'',l:'Semua'},{v:'internal',l:'Internal'},{v:'external',l:'External'}] },
          ].map(f => (
            <div key={f.key} className="tr-fg">
              <label className="tr-fl">{f.label}</label>
              <select className="tr-fs" value={filters[f.key]} onChange={e => setF(f.key, e.target.value)}>
                {f.opts.map((o,i) => <option key={i} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          <div className="tr-fd"/>
          <div className="tr-fg">
            <label className="tr-fl">Divisi</label>
            <select className="tr-fs" value={filters.divisi} onChange={e => setF('divisi', e.target.value)}>
              <option value="">Semua Divisi</option>
              {options.divisi.map((v,i) => <option key={i} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="tr-fd"/>
          <div className="tr-fg">
            <label className="tr-fl">Status</label>
            <select className="tr-fs" value={filters.status} onChange={e => setF('status', e.target.value)}>
              <option value="">Semua Status</option>
              <option value="done">Done</option>
              <option value="in progress">In Progress</option>
              <option value="cancel">Cancel</option>
            </select>
          </div>
          <div className="tr-fd"/>
          <div className="tr-fg">
            <label className="tr-fl">Periode Mulai</label>
            <input type="month" className="tr-fs" value={filters.startMonth} onChange={e => setF('startMonth', e.target.value)}/>
          </div>
          <div className="tr-fd"/>
          <div className="tr-fg">
            <label className="tr-fl">Periode Akhir</label>
            <input type="month" className="tr-fs" value={filters.endMonth} onChange={e => setF('endMonth', e.target.value)}/>
          </div>
        </div>
        <div className="tr-fa">
          <button className="tr-br" onClick={reset}>Reset</button>
          <button className="tr-ba" onClick={apply}>Terapkan</button>
        </div>
      </div>

      {kpiRows.map((row, ri) => (
        <div key={ri} className="tr-kpi3">
          {row.map((c,i) => (
            <div key={i} className="tr-kcard">
              <div className="tr-ktop">
                <div className="tr-kico" style={{ background:c.bg }}>{c.icon}</div>
                <span className="tr-kpct" style={{ color:c.pctC }}>{c.pct}</span>
              </div>
              <p className="tr-kval">{c.val}</p>
              <p className="tr-klbl">{c.lbl}</p>
              <div className="tr-kbar" style={{ background:c.bar }}/>
            </div>
          ))}
        </div>
      ))}

      {/* AREA TREND — full width */}
      <div className="tr-card">
        <p className="tr-ctitle">Tren Pelatihan per Bulan</p>
        <p className="tr-cdesc">Jumlah peserta pelatihan setiap bulan</p>
        {(trend||[]).length === 0 ? <p className="tr-nodata">Tidak ada data</p> : (
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={trend} margin={{ top:8, right:16, left:0, bottom:40 }}>
              <defs>
                <linearGradient id="gTr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={RED} stopOpacity={0.18}/>
                  <stop offset="100%" stopColor={RED} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
              <XAxis dataKey="bulan" tick={{ fontSize:11, fill:'#888' }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Area type="monotone" dataKey="jumlah" name="Peserta" stroke={RED} strokeWidth={2}
                fill="url(#gTr)" dot={{ r:3, fill:RED, strokeWidth:0 }} activeDot={{ r:5 }}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ROW: Hbar divisi (55%) + Donut jenis (45%) */}
      <div className="tr-row2" style={{ gridTemplateColumns:'1.2fr 1fr' }}>

        <div className="tr-card">
          <p className="tr-ctitle">Peserta per Divisi</p>
          <p className="tr-cdesc">Jumlah karyawan mengikuti pelatihan per divisi</p>
          {divisiS.length === 0 ? <p className="tr-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={Math.max(200, divisiS.length*32)}>
              <BarChart data={divisiS} layout="vertical" barCategoryGap="28%"
                margin={{ top:0, right:50, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="divisi" tick={{ fontSize:11, fill:'#444' }} width={110} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Bar dataKey="jumlah" name="Peserta" fill={NAVY} radius={[0,4,4,0]} maxBarSize={18}
                  label={{ position:'right', fontSize:11, fill:NAVY, fontWeight:600 }}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="tr-card">
          <p className="tr-ctitle">Status Pelatihan</p>
          <p className="tr-cdesc">Komposisi done, in progress, dan cancel</p>
          {pieStatus.length === 0 ? <p className="tr-nodata">Tidak ada data</p> : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieStatus} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={76} paddingAngle={3} cornerRadius={4}
                    dataKey="jumlah" nameKey="status">
                    {pieStatus.map((d,i) => <Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip content={<CT/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="tr-leg">
                {pieStatus.map((d,i) => (
                  <div key={i} className="tr-litem">
                    <span className="tr-lleft"><span className="tr-ldot" style={{ background:d.color }}/><span className="tr-lname" style={{ textTransform:'capitalize' }}>{d.status}</span></span>
                    <span className="tr-lval">{d.jumlah}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>

      {/* Pelatihan terpopuler — full width */}
      <div className="tr-card">
        <p className="tr-ctitle">Jenis Pelatihan Terpopuler</p>
        <p className="tr-cdesc">Nama pelatihan yang paling banyak diikuti</p>
        {pelatihanS.length === 0 ? <p className="tr-nodata">Tidak ada data</p> : (
          <ResponsiveContainer width="100%" height={Math.max(220, pelatihanS.length*32)}>
            <BarChart data={pelatihanS} layout="vertical" barCategoryGap="28%"
              margin={{ top:0, right:60, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false}/>
              <XAxis type="number" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="pelatihan" tick={{ fontSize:11, fill:'#444' }} width={185} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="jumlah" name="Peserta" fill={RED} radius={[0,4,4,0]} maxBarSize={20}
                label={{ position:'right', fontSize:11, fill:RED, fontWeight:600 }}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}

export default memo(Training)
