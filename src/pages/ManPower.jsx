import { useEffect, useState, memo } from 'react'
import axios from 'axios'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import './ManPower.css'

const API_URL = 'http://127.0.0.1:5000/manpower/dashboard'
const RED = '#BF1A1A', NAVY = '#060771', GREEN = '#16a34a', ORANGE = '#ea580c'

const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.1)', borderRadius:8, padding:'8px 12px', fontSize:12 }}>
      {label && <p style={{ fontWeight:600, color:NAVY, marginBottom:4 }}>{label}</p>}
      {payload.map((p,i) => <p key={i} style={{ color:p.color||NAVY, margin:'2px 0' }}>{p.name}: <strong>{p.value}</strong></p>)}
    </div>
  )
}

function ManPower() {
  const [data, setData]       = useState({ kpi:{total:0,permanent:0,kontrak:0}, jabatan:[], branch:[], group_project:[], status_kontrak:[] })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [options, setOptions] = useState({ branch:[], jabatan:[], status_kontrak:[], group_project:[] })
  const [filters, setFilters] = useState({ branch:'', jabatan:'', status_kontrak:'', group_project:'' })

  const fetchData = (q = {}) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q.branch)         params.append('branch', q.branch)
    if (q.jabatan)        params.append('jabatan', q.jabatan)
    if (q.status_kontrak) params.append('status_kontrak', q.status_kontrak)
    if (q.group_project)  params.append('group_project', q.group_project)
    const url = params.toString() ? `${API_URL}?${params}` : API_URL
    axios.get(url)
      .then(res => { setData(res.data); setError(null) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

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

  const setF  = (k,v) => setFilters(p => ({ ...p, [k]:v }))
  const apply = () => fetchData(filters)
  const reset = () => { const e={branch:'',jabatan:'',status_kontrak:'',group_project:''}; setFilters(e); fetchData(e) }

  if (loading) return <div className="mp-wrap"><div className="mp-loading"><div className="mp-spin"/><p>Memuat data...</p></div></div>
  if (error)   return <div className="mp-wrap"><div className="mp-err"><p>Gagal: {error}</p><button onClick={() => fetchData(filters)}>Coba lagi</button></div></div>

  const total   = data.kpi.total     || 0
  const perm    = data.kpi.permanent || 0
  const kon     = data.kpi.kontrak   || 0
  const pctPerm = total ? Math.round(perm / total * 100) : 0
  const pctKon  = total ? Math.round(kon  / total * 100) : 0

  const pieData = data.status_kontrak.map((d,i) => ({
    ...d, color: i===0 ? NAVY : i===1 ? RED : ORANGE
  }))

  const topJabatan   = [...data.jabatan].sort((a,b) => b.jumlah-a.jumlah).slice(0,10)
  const branchSorted = [...data.branch].sort((a,b) => b.jumlah-a.jumlah)
  const gpSorted     = [...data.group_project].sort((a,b) => b.jumlah-a.jumlah)

  return (
    <div className="mp-wrap">

      {/* FILTER */}
      <div className="mp-filter">
        <div className="mp-fi">
          {[
            { key:'branch', label:'Branch' },
            { key:'jabatan', label:'Jabatan' },
            { key:'status_kontrak', label:'Status Kontrak' },
            { key:'group_project', label:'Group Project' },
          ].map((f,idx) => (
            <>
              {idx > 0 && <div key={`d${idx}`} className="mp-fd"/>}
              <div key={f.key} className="mp-fg">
                <label className="mp-fl">{f.label}</label>
                <select className="mp-fs" value={filters[f.key]} onChange={e => setF(f.key, e.target.value)}>
                  <option value="">Semua</option>
                  {options[f.key].map((v,i) => (
                    <option key={i} value={v}>{f.key==='status_kontrak' ? v.charAt(0).toUpperCase()+v.slice(1) : v}</option>
                  ))}
                </select>
              </div>
            </>
          ))}
        </div>
        <div className="mp-fa">
          <button className="mp-br" onClick={reset}>Reset</button>
          <button className="mp-ba" onClick={apply}>Terapkan</button>
        </div>
      </div>

      {/* KPI — 4 card 1 baris */}
      <div className="mp-kpi4">
        {[
          { bg:'#e8e9f9', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="7" r="4" fill={NAVY}/><circle cx="17" cy="7" r="3" fill={NAVY} opacity=".4"/><path d="M1 20c0-4 3.6-7 8-7s8 3 8 7" fill={NAVY} opacity=".3"/><path d="M17 13c2.5 0 5 1.5 5 4" stroke={NAVY} strokeWidth="1.5" fill="none" opacity=".4"/></svg>, pct:'Total', pctC:NAVY, val:total, lbl:'Total Karyawan', bar:NAVY },
          { bg:'#dcfce7', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 3l6 3v5c0 4-2.5 7-6 8.5C8.5 18 6 15 6 11V6l6-3z" fill={GREEN} opacity=".8"/></svg>, pct:`${pctPerm}%`, pctC:GREEN, val:perm, lbl:'Karyawan Permanent', bar:GREEN },
          { bg:'#f9e8e8', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" fill={RED} opacity=".8"/><path d="M8 6V5a4 4 0 018 0v1" fill={RED}/></svg>, pct:`${pctKon}%`, pctC:RED, val:kon, lbl:'Karyawan Kontrak', bar:RED },
          { bg:'#fff3e0', icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 17l5-5 4 4 7-8" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" fill="none"/></svg>, pct:'ratio', pctC:ORANGE, val:`${pctPerm}%`, lbl:'Rasio Permanent', bar:ORANGE },
        ].map((c,i) => (
          <div key={i} className="mp-kcard">
            <div className="mp-ktop">
              <div className="mp-kico" style={{ background:c.bg }}>{c.icon}</div>
              <span className="mp-kpct" style={{ color:c.pctC }}>{c.pct}</span>
            </div>
            <p className="mp-kval">{c.val}</p>
            <p className="mp-klbl">{c.lbl}</p>
            <div className="mp-kbar" style={{ background:c.bar }}/>
          </div>
        ))}
      </div>

      {/* ROW UTAMA: 3 kolom — Donut + Jabatan hbar + Branch vertikal */}
      <div className="mp-row3">

        {/* Donut status kontrak */}
        <div className="mp-card">
          <p className="mp-ctitle">Komposisi Status Kontrak</p>
          <p className="mp-cdesc">Perbandingan jumlah per jenis kontrak</p>
          {pieData.length === 0 ? <p className="mp-nodata">Tidak ada data</p> : (
            <>
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={76} paddingAngle={3} cornerRadius={4}
                    dataKey="jumlah">
                    {pieData.map((d,i) => <Cell key={i} fill={d.color}/>)}
                  </Pie>
                  <Tooltip content={<CT/>}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="mp-leg">
                {pieData.map((d,i) => (
                  <div key={i} className="mp-litem">
                    <span className="mp-lleft"><span className="mp-ldot" style={{ background:d.color }}/><span className="mp-lname" style={{ textTransform:'capitalize' }}>{d.status_kontrak}</span></span>
                    <span className="mp-lval">{d.jumlah}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Hbar jabatan */}
        <div className="mp-card">
          <p className="mp-ctitle">Distribusi Jabatan</p>
          <p className="mp-cdesc">Jumlah karyawan per posisi jabatan (top 10)</p>
          {topJabatan.length === 0 ? <p className="mp-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topJabatan} layout="vertical" barCategoryGap="25%"
                margin={{ top:0, right:40, left:0, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="jabatan" tick={{ fontSize:11, fill:'#555' }} width={110} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Bar dataKey="jumlah" name="Jumlah" fill={NAVY} radius={[0,4,4,0]} maxBarSize={18}
                  label={{ position:'right', fontSize:11, fill:NAVY, fontWeight:600 }}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="mp-card">
        <p className="mp-ctitle">Distribusi Group Project</p>
        <p className="mp-cdesc">Jumlah karyawan per kelompok project / divisi kerja</p>
        {gpSorted.length === 0 ? <p className="mp-nodata">Tidak ada data</p> : (
          <ResponsiveContainer width="100%" height={Math.max(240, gpSorted.length * 34)}>
            <BarChart data={gpSorted} layout="vertical" barCategoryGap="28%"
              margin={{ top:0, right:60, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false}/>
              <XAxis type="number" tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
              <YAxis type="category" dataKey="group_project" tick={{ fontSize:11, fill:'#444' }} width={145} axisLine={false} tickLine={false}/>
              <Tooltip content={<CT/>}/>
              <Bar dataKey="jumlah" name="Jumlah" fill={NAVY} radius={[0,4,4,0]} maxBarSize={22}
                label={{ position:'right', fontSize:11, fill:NAVY, fontWeight:600 }}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

        

      </div>

      <div className="mp-card">
          <p className="mp-ctitle">Karyawan per Branch</p>
          <p className="mp-cdesc">Jumlah karyawan di setiap cabang / lokasi</p>
          {branchSorted.length === 0 ? <p className="mp-nodata">Tidak ada data</p> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={branchSorted} barCategoryGap="35%"
                margin={{ top:4, right:8, left:0, bottom:60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
                <XAxis dataKey="branch" tick={{ fontSize:10, fill:'#888' }} angle={-35} textAnchor="end" height={70} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'#888' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CT/>}/>
                <Bar dataKey="jumlah" name="Jumlah" fill={RED} radius={[4,4,0,0]} maxBarSize={28}
                  label={{ position:'top', fontSize:11, fill:RED, fontWeight:600 }}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>    
      </div>
  )
}

export default memo(ManPower)
