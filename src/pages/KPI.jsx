import { useState, useEffect, useCallback, memo } from 'react'
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './KPI.css'

const API_URL = 'http://127.0.0.1:5000/kpi/dashboard'
const NAVY    = '#060771'
const RED     = '#BF1A1A'
const GREEN   = '#16a34a'
const ORANGE  = '#ea580c'
const AMBER   = '#b45309'

// ── Format nilai KPI sesuai unit ──────────────────────────
const fmtVal = (v, unit = '') => {
  if (v === null || v === undefined) return '—'
  const num = Number(v)
  if (isNaN(num)) return String(v)
  if (unit.toLowerCase().includes('%')) return `${(num * 100).toFixed(0)}%`
  return num % 1 === 0 ? String(num) : num.toFixed(2)
}

const fmtPct = v =>
  v === null || v === undefined ? '—' : `${Number(v).toFixed(1)}%`

// ── Custom tooltip ─────────────────────────────────────────
const CT = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#fff', border: '0.5px solid rgba(0,0,0,0.1)',
      borderRadius: 8, padding: '8px 12px', fontSize: 12
    }}>
      {label && <p style={{ fontWeight: 600, color: NAVY, marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || NAVY, margin: '2px 0' }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ── Badge status ───────────────────────────────────────────
const Badge = ({ status }) => {
  if (!status) return <span className="kpi-badge kpi-badge--gray">—</span>
  return status === 'tercapai'
    ? <span className="kpi-badge kpi-badge--green">Tercapai</span>
    : <span className="kpi-badge kpi-badge--red">Tidak Tercapai</span>
}

// ── Radial progress kecil ──────────────────────────────────
const RadialPct = ({ pct, color }) => {
  const r = 16, circ = 2 * Math.PI * r, dash = (pct / 100) * circ
  return (
    <svg width={40} height={40} viewBox="0 0 40 40">
      <circle cx={20} cy={20} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={4}/>
      <circle cx={20} cy={20} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 20 20)"/>
      <text x={20} y={24} textAnchor="middle" fontSize={9} fontWeight={600} fill={color}>
        {Math.round(pct)}%
      </text>
    </svg>
  )
}

// ── KOMPONEN UTAMA ─────────────────────────────────────────
function KPI() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [activeKPI, setActiveKPI] = useState(null)
  const [filters, setFilters] = useState({ bulan: '', no: '', status: '' })

  const fetchData = useCallback(async (f = filters) => {
    setLoading(true)
    try {
      const p = new URLSearchParams()
      if (f.bulan)  p.append('bulan',  f.bulan)
      if (f.no)     p.append('no',     f.no)
      if (f.status) p.append('status', f.status)
      const url = p.toString() ? `${API_URL}?${p}` : API_URL
      const res = await fetch(url)
      if (!res.ok) throw new Error('Gagal mengambil data')
      const json = await res.json()
      setData(json); setError(null)
      if (!activeKPI && json.kpi_list?.length) setActiveKPI(json.kpi_list[0].no)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchData() }, [])

  const setF  = (k, v) => setFilters(p => ({ ...p, [k]: v }))
  const apply = () => fetchData(filters)
  const reset = () => { const e = { bulan: '', no: '', status: '' }; setFilters(e); fetchData(e) }

  if (loading) return (
    <div className="kpi-wrap">
      <div className="kpi-loading"><div className="kpi-spin"/><p>Memuat data KPI...</p></div>
    </div>
  )
  if (error) return (
    <div className="kpi-wrap">
      <div className="kpi-err"><p>Gagal: {error}</p><button onClick={() => fetchData()}>Coba lagi</button></div>
    </div>
  )
  if (!data) return null

  const { summary, kpi_list, monthly_2026, status_trend, bulan_options } = data

  // KPI aktif untuk detail panel
  const detailKPI = kpi_list.find(k => k.no === activeKPI)

  // Chart status trend — sort chronological
  const statusChartData = [...status_trend].sort((a, b) => {
    const mo = { Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12 }
    const parse = s => { const [m, y] = (s||'').split(' '); return parseInt(y||0)*12+(mo[m]||0) }
    return parse(a.bulan) - parse(b.bulan)
  })

  // Bar chart target vs aktual untuk KPI aktif
  const detailBarData = (detailKPI?.monthly || []).map(m => {
    const isPct = (detailKPI?.unit || '').toLowerCase().includes('%')
    return {
      bulan:  m.bulan,
      target: m.target !== null ? parseFloat((m.target * (isPct ? 100 : 1)).toFixed(2)) : null,
      actual: m.actual !== null ? parseFloat((m.actual * (isPct ? 100 : 1)).toFixed(2)) : null,
      status: m.status
    }
  })

  // Warna achievement rate
  const achvColor = pct => pct >= 70 ? GREEN : pct >= 50 ? AMBER : RED

  return (
    <div className="kpi-wrap">

      {/* ── FILTER ── */}
      <div className="kpi-filter">
        <div className="kpi-fi">
          <div className="kpi-fg">
            <label className="kpi-fl">Bulan</label>
            <select className="kpi-fs" value={filters.bulan} onChange={e => setF('bulan', e.target.value)}>
              <option value="">Semua Bulan</option>
              {bulan_options.map((b, i) => <option key={i} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="kpi-fd"/>
          <div className="kpi-fg">
            <label className="kpi-fl">KPI</label>
            <select className="kpi-fs" value={filters.no} onChange={e => setF('no', e.target.value)}>
              <option value="">Semua KPI</option>
              {kpi_list.map(k => (
                <option key={k.no} value={k.no}>KPI {k.no} — {k.kpi}</option>
              ))}
            </select>
          </div>
          <div className="kpi-fd"/>
          <div className="kpi-fg">
            <label className="kpi-fl">Status</label>
            <select className="kpi-fs" value={filters.status} onChange={e => setF('status', e.target.value)}>
              <option value="">Semua Status</option>
              <option value="tercapai">Tercapai</option>
              <option value="tidak_tercapai">Tidak Tercapai</option>
            </select>
          </div>
        </div>
        <div className="kpi-fa">
          <button className="kpi-br" onClick={reset}>Reset</button>
          <button className="kpi-ba" onClick={apply}>Terapkan</button>
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="kpi-summary-grid">
        {[
          {
            label: 'Total KPI', val: summary.total_kpi, sub: 'Bulan dipilih', color: NAVY, bg: '#e8e9f9',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke={NAVY} strokeWidth="1.8" fill="none"/>
              <path d="M7 9h10M7 13h6" stroke={NAVY} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          },
          {
            label: 'Tercapai', val: summary.tercapai, sub: `${fmtPct(summary.pct_tercapai)} dari total`, color: GREEN, bg: '#dcfce7',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke={GREEN} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          },
          {
            label: 'Tidak Tercapai', val: summary.tidak_tercapai, sub: `${fmtPct(100 - summary.pct_tercapai)} dari total`, color: RED, bg: '#f9e8e8',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke={RED} strokeWidth="2" fill="none"/>
              <path d="M15 9l-6 6M9 9l6 6" stroke={RED} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          },
          {
            label: 'Achievement Rate', val: `${fmtPct(summary.pct_tercapai)}`, sub: 'Keseluruhan',
            color: achvColor(summary.pct_tercapai),
            bg: summary.pct_tercapai >= 70 ? '#dcfce7' : summary.pct_tercapai >= 50 ? '#fef3c7' : '#f9e8e8',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 17l5-5 4 4 7-8" stroke={achvColor(summary.pct_tercapai)} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            </svg>
          },
        ].map((c, i) => (
          <div key={i} className="kpi-scard">
            <div className="kpi-scard-top">
              <div className="kpi-sico" style={{ background: c.bg }}>{c.icon}</div>
            </div>
            <p className="kpi-sval" style={{ color: c.color }}>{c.val}</p>
            <p className="kpi-slbl">{c.label}</p>
            {c.sub && <p className="kpi-ssub">{c.sub}</p>}
            <div className="kpi-sbar" style={{ background: c.color }}/>
          </div>
        ))}
      </div>

      {/* ── STACKED BAR: achievement per bulan ── */}
      <div className="kpi-card">
        <p className="kpi-ctitle">Achievement per Bulan</p>
        <p className="kpi-cdesc">Jumlah KPI tercapai vs tidak tercapai tiap bulan (seluruh data)</p>
        {statusChartData.length === 0
          ? <p className="kpi-nodata">Tidak ada data</p>
          : (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={statusChartData} barCategoryGap="40%"
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
                <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#888' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} allowDecimals={false}/>
                <Tooltip content={<CT/>}/>
                <Legend wrapperStyle={{ fontSize: 12 }}/>
                <Bar dataKey="tercapai" name="Tercapai" stackId="s" fill={GREEN} maxBarSize={70}/>
                <Bar dataKey="tidak_tercapai" name="Tidak Tercapai" stackId="s" fill={RED} radius={[4, 4, 0, 0]} maxBarSize={70}/>
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* ── TABEL KPI LIST + KLIK UNTUK DETAIL ── */}
      <div className="kpi-card">
        <p className="kpi-ctitle">Daftar KPI &amp; Achievement Rate</p>
        <p className="kpi-cdesc">Klik baris untuk melihat detail Target vs Aktual per bulan</p>
        <div className="kpi-table-wrap">
          <table className="kpi-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>No</th>
                <th>Indikator</th>
                <th>Target</th>
                <th style={{ width: 80, textAlign: 'center' }}>Bulan</th>
                <th style={{ width: 90, textAlign: 'center' }}>Tercapai</th>
                <th style={{ width: 80, textAlign: 'center' }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {kpi_list.map(k => (
                <tr key={k.no}
                  className={`kpi-trow${activeKPI === k.no ? ' kpi-trow--active' : ''}`}
                  onClick={() => setActiveKPI(k.no)}>
                  <td style={{ color: '#888', textAlign: 'center' }}>{k.no}</td>
                  <td>
                    <span className="kpi-tname">{k.kpi}</span>
                    <span className="kpi-tunit">{k.unit}</span>
                  </td>
                  <td className="kpi-ttarget">{k.target_desc}</td>
                  <td style={{ textAlign: 'center' }}>{k.bulan_ada}</td>
                  <td style={{ textAlign: 'center' }}>{k.bulan_ok} / {k.bulan_ada}</td>
                  <td style={{ textAlign: 'center' }}>
                    <RadialPct pct={k.pct_tercapai} color={achvColor(k.pct_tercapai)}/>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── DETAIL KPI TERPILIH ── */}
      {detailKPI && (
        <div className="kpi-card kpi-detail-card">
          <div className="kpi-detail-header">
            <div>
              <p className="kpi-ctitle">Detail KPI {detailKPI.no}: {detailKPI.kpi}</p>
              <p className="kpi-cdesc">{detailKPI.target_desc} · {detailKPI.unit}</p>
            </div>
            <div className="kpi-detail-badges">
              {detailKPI.is_lower_better
                ? <span className="kpi-pill kpi-pill--blue">Lower is better</span>
                : <span className="kpi-pill kpi-pill--navy">Higher is better</span>
              }
            </div>
          </div>

          {/* Bar chart Target vs Aktual per bulan */}
          {detailBarData.length > 0 && (
            <>
              <p className="kpi-section-label">Target vs Aktual per Bulan</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={detailBarData} barCategoryGap="35%"
                  margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false}/>
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false}
                    tickFormatter={v => detailKPI.unit.toLowerCase().includes('%') ? `${v}%` : v}/>
                  <Tooltip content={<CT/>}/>
                  <Legend wrapperStyle={{ fontSize: 12 }}/>
                  <Bar dataKey="target" name="Target" fill={NAVY} fillOpacity={0.3} radius={[3, 3, 0, 0]} maxBarSize={50}/>
                  <Bar dataKey="actual" name="Aktual" fill={NAVY} radius={[3, 3, 0, 0]} maxBarSize={50}
                    label={{ position: 'top', fontSize: 11, fill: NAVY, fontWeight: 600,
                      formatter: v => v !== null ? (detailKPI.unit.toLowerCase().includes('%') ? `${v}%` : v) : '' }}/>
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {/* Tabel mini bulan untuk KPI ini */}
          {detailKPI.monthly?.length > 0 && (
            <>
              <p className="kpi-section-label" style={{ marginTop: 20 }}>Rekapitulasi per Bulan</p>
              <div className="kpi-mini-table-wrap">
                <table className="kpi-mini-table">
                  <thead>
                    <tr>
                      <th>Bulan</th>
                      <th style={{ textAlign: 'right' }}>Target</th>
                      <th style={{ textAlign: 'right' }}>Aktual</th>
                      <th style={{ textAlign: 'center' }}>Gap</th>
                      <th style={{ textAlign: 'center' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailKPI.monthly.map((m, i) => {
                      const gap = m.actual !== null && m.target !== null
                        ? ((m.actual - m.target) * (detailKPI.unit.toLowerCase().includes('%') ? 100 : 1)).toFixed(2)
                        : null
                      const gapColor = gap === null ? '#888'
                        : detailKPI.is_lower_better
                          ? (Number(gap) <= 0 ? GREEN : RED)
                          : (Number(gap) >= 0 ? GREEN : RED)
                      return (
                        <tr key={i}>
                          <td>{m.bulan}</td>
                          <td style={{ textAlign: 'right' }} className="kpi-tcell-muted">
                            {fmtVal(m.target, detailKPI.unit)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {fmtVal(m.actual, detailKPI.unit)}
                          </td>
                          <td style={{ textAlign: 'center', color: gapColor, fontWeight: 600 }}>
                            {gap !== null
                              ? `${Number(gap) >= 0 ? '+' : ''}${gap}${detailKPI.unit.toLowerCase().includes('%') ? '%' : ''}`
                              : '—'}
                          </td>
                          <td style={{ textAlign: 'center' }}><Badge status={m.status}/></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TABEL LENGKAP monthly_2026 (terfilter) ── */}
      <div className="kpi-card">
        <p className="kpi-ctitle">Rekapitulasi Semua KPI</p>
        <p className="kpi-cdesc">Seluruh data Target vs Aktual yang sesuai filter</p>
        {monthly_2026.length === 0
          ? <p className="kpi-nodata">Tidak ada data sesuai filter</p>
          : (
            <div className="kpi-table-wrap">
              <table className="kpi-table">
                <thead>
                  <tr>
                    <th>Bulan</th>
                    <th>Indikator</th>
                    <th style={{ textAlign: 'right' }}>Target</th>
                    <th style={{ textAlign: 'right' }}>Aktual</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly_2026.map((r, i) => (
                    <tr key={i}>
                      <td className="kpi-tcell-muted">{r.bulan}</td>
                      <td>
                        <span className="kpi-tname">{r.kpi}</span>
                        <span className="kpi-tunit">{r.unit}</span>
                      </td>
                      <td style={{ textAlign: 'right' }} className="kpi-tcell-muted">
                        {fmtVal(r.target, r.unit)}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>
                        {fmtVal(r.actual, r.unit)}
                      </td>
                      <td style={{ textAlign: 'center' }}><Badge status={r.status}/></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

    </div>
  )
}

export default memo(KPI)
