import { useState, useEffect, memo } from 'react'
import './Home.css'

// ─── API endpoints ──────────────────────────────────────────
const API = {
  manpower:    'http://127.0.0.1:5000/manpower/dashboard',
  recruitment: 'http://127.0.0.1:5000/recruitment/dashboard',
  salary:      'http://127.0.0.1:5000/salary/dashboard',
  overtime:    'http://127.0.0.1:5000/overtime/dashboard',
  bpjs:        'http://127.0.0.1:5000/bpjs/dashboard',
  internship:  'http://127.0.0.1:5000/internship/dashboard',
  kpi:         'http://127.0.0.1:5000/kpi/dashboard',
}

// ─── Colors ────────────────────────────────────────────────
const NAVY   = '#060771'
const RED    = '#BF1A1A'
const GREEN  = '#16a34a'
const ORANGE = '#ea580c'
const AMBER  = '#b45309'

// ─── Formatter ─────────────────────────────────────────────
const fmtRp = n => {
  if (n === null || n === undefined) return '—'
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`
  if (n >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)}Jt`
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n)
}
const fmtNum = n => new Intl.NumberFormat('id-ID').format(n)
const fmtPct = n => `${Number(n).toFixed(1)}%`

// ─── Status dot ────────────────────────────────────────────
const Dot = ({ color }) => (
  <span style={{
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: color, flexShrink: 0, marginTop: 2
  }}/>
)

// ─── Mini KPI Card ─────────────────────────────────────────
const MiniCard = ({ label, value, sub, color = NAVY, bg = '#e8e9f9', icon, alert }) => (
  <div className={`hm-mcard${alert ? ' hm-mcard--alert' : ''}`}>
    <div className="hm-mcard-top">
      <div className="hm-mcard-ico" style={{ background: bg }}>{icon}</div>
      {alert && <span className="hm-alert-dot"/>}
    </div>
    <p className="hm-mcard-val" style={{ color }}>{value}</p>
    <p className="hm-mcard-lbl">{label}</p>
    {sub && <p className="hm-mcard-sub">{sub}</p>}
  </div>
)

// ─── Section header ────────────────────────────────────────
const SectionHeader = ({ title, subtitle, onClick, linkLabel }) => (
  <div className="hm-sec-header">
    <div>
      <p className="hm-sec-title">{title}</p>
      {subtitle && <p className="hm-sec-sub">{subtitle}</p>}
    </div>
    {onClick && (
      <button className="hm-sec-link" onClick={onClick}>{linkLabel || 'Detail →'}</button>
    )}
  </div>
)

// ─── Skeleton loader ───────────────────────────────────────
const Skel = ({ w = '100%', h = 20 }) => (
  <div className="hm-skel" style={{ width: w, height: h }}/>
)

// ─── KOMPONEN UTAMA ─────────────────────────────────────────
function Home({ onNavigate }) {
  const [d, setD]       = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchers = Object.entries(API).map(([key, url]) =>
      fetch(url)
        .then(r => r.ok ? r.json() : null)
        .then(json => ({ key, json }))
        .catch(() => ({ key, json: null }))
    )
    Promise.all(fetchers).then(results => {
      const merged = {}
      results.forEach(({ key, json }) => { merged[key] = json })
      setD(merged); setLoading(false)
    })
  }, [])

  // ── Shorthand data ─────────────────────────────────────
  const mp   = d.manpower
  const rc   = d.recruitment
  const sl   = d.salary
  const ot   = d.overtime
  const bp   = d.bpjs
  const it   = d.internship
  const kp   = d.kpi

  // KPI achievement
  const kpiPct   = kp?.summary?.pct_tercapai ?? null
  const kpiOk    = kp?.summary?.tercapai ?? 0
  const kpiTotal = kp?.summary?.total_kpi ?? 0

  // Manpower
  const totalKary  = mp?.kpi?.total ?? 0
  const permanent  = mp?.kpi?.permanent ?? 0
  const kontrak    = mp?.kpi?.kontrak ?? 0
  const pctPerm    = totalKary ? Math.round(permanent / totalKary * 100) : 0

  // Rekrutmen
  const rcTotal    = rc?.kpi?.total ?? 0
  const onProcess  = rc?.kpi?.on_process ?? 0
  const accepted   = rc?.kpi?.accepted ?? 0
  const rejected   = rc?.kpi?.rejected ?? 0

  // Salary
  const totalGaji  = sl?.kpi?.total_gaji ?? 0
  const totalPph   = sl?.kpi?.total_pph21 ?? 0

  // Overtime
  const otCost     = ot?.kpi?.total_overtime_cost ?? 0
  const otPct      = ot?.kpi?.avg_overtime_percent ?? 0
  const otGrowth   = ot?.kpi?.overtime_growth ?? 0

  // BPJS
  const totalBpjs  = bp?.kpi?.total_karyawan_bpjs ?? 0
  const totalBayar = bp?.kpi?.total_semua ?? 0

  // Internship
  const itTotal    = it?.kpi?.total ?? 0
  const itOnboard  = it?.kpi?.onboard ?? 0
  const itBerakhir = it?.kpi?.akan_berakhir ?? 0
  const itButuh    = it?.kpi?.butuh_surat_balasan ?? 0

  // KPI cards list (top 3 tidak tercapai)
  const kpiTidak = (kp?.kpi_list || [])
    .filter(k => k.pct_tercapai < 100)
    .sort((a, b) => a.pct_tercapai - b.pct_tercapai)
    .slice(0, 5)

  // Top overtime projects (3 teratas)
  const topOtProject = (ot?.overtime_by_project || []).slice(0, 5)

  // Rekrutmen funnel (bar horizontal sederhana)
  const funnel = rc?.funnel || []
  const maxFunnel = Math.max(...funnel.map(f => f.jumlah), 1)

  const nav = page => onNavigate && onNavigate(page)

  if (loading) return (
    <div className="hm-wrap">
      <div className="hm-skeleton-grid">
        {[...Array(4)].map((_, i) => <Skel key={i} h={90}/>)}
      </div>
      <div className="hm-skeleton-grid" style={{ marginTop: 16 }}>
        {[...Array(3)].map((_, i) => <Skel key={i} h={200}/>)}
      </div>
    </div>
  )

  return (
    <div className="hm-wrap">

      {/* ══════════════════════════════════════
          BARIS 1 — 5 KPI UTAMA
      ══════════════════════════════════════ */}
      <div className="hm-kpi5">

        {/* Headcount */}
        <MiniCard
          label="Total Karyawan"
          value={fmtNum(totalKary)}
          sub={`${fmtNum(permanent)} Permanen · ${fmtNum(kontrak)} Kontrak`}
          color={NAVY} bg="#e8e9f9"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="7" r="4" fill={NAVY}/>
            <circle cx="17" cy="7" r="3" fill={NAVY} opacity=".4"/>
            <path d="M1 20c0-4 3.6-7 8-7s8 3 8 7" fill={NAVY} opacity=".3"/>
            <path d="M17 13c2.5 0 5 1.5 5 4" stroke={NAVY} strokeWidth="1.5" fill="none" opacity=".4"/>
          </svg>}
        />

        {/* KPI Achievement */}
        <MiniCard
          label="KPI Tercapai"
          value={kpiPct !== null ? fmtPct(kpiPct) : '—'}
          sub={`${kpiOk} dari ${kpiTotal} indikator`}
          color={kpiPct >= 70 ? GREEN : kpiPct >= 50 ? AMBER : RED}
          bg={kpiPct >= 70 ? '#dcfce7' : kpiPct >= 50 ? '#fef3c7' : '#f9e8e8'}
          alert={kpiPct !== null && kpiPct < 50}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M3 17l5-5 4 4 7-8" stroke={kpiPct >= 70 ? GREEN : kpiPct >= 50 ? AMBER : RED} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          </svg>}
        />

        {/* Payroll */}
        <MiniCard
          label="Total Payroll"
          value={fmtRp(totalGaji)}
          sub={`PPH21: ${fmtRp(totalPph)}`}
          color={NAVY} bg="#e8e9f9"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="6" width="20" height="13" rx="2" fill={NAVY} opacity=".8"/>
            <path d="M8 12h2M14 12h2M12 9v6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>}
        />

        {/* Overtime Cost */}
        <MiniCard
          label="Overtime Cost"
          value={fmtRp(otCost)}
          sub={`Avg ${fmtPct(otPct)} dari gaji${otGrowth !== 0 ? ` · ${otGrowth > 0 ? '▲' : '▼'} ${Math.abs(otGrowth)}%` : ''}`}
          color={otGrowth > 10 ? RED : otGrowth > 0 ? AMBER : NAVY}
          bg={otGrowth > 10 ? '#f9e8e8' : otGrowth > 0 ? '#fef3c7' : '#e8e9f9'}
          alert={otGrowth > 15}
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke={ORANGE} strokeWidth="2" fill="none"/>
            <path d="M12 7v5l3 3" stroke={ORANGE} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>}
        />

        {/* BPJS */}
        <MiniCard
          label="Total BPJS Dibayar"
          value={fmtRp(totalBayar)}
          sub={`${fmtNum(totalBpjs)} peserta terdaftar`}
          color={NAVY} bg="#e8e9f9"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 3l6 3v5c0 4-2.5 7-6 8.5C8.5 18 6 15 6 11V6l6-3z" fill={GREEN} opacity=".8"/>
            <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>}
        />

      </div>

      {/* ══════════════════════════════════════
          BARIS 2 — 3 KOLOM TENGAH
      ══════════════════════════════════════ */}
      <div className="hm-row3">

        {/* ── KOLOM KIRI: KPI Status ─────────── */}
        <div className="hm-card">
          <SectionHeader
            title="Status KPI Bulan Ini"
            subtitle="Indikator yang belum mencapai target"
            onClick={() => nav('kpi')} linkLabel="Lihat semua →"
          />

          {/* Meter besar achievement */}
          <div className="hm-kpi-meter">
            <div className="hm-kpi-meter-track">
              <div className="hm-kpi-meter-fill"
                style={{
                  width: `${kpiPct || 0}%`,
                  background: kpiPct >= 70 ? GREEN : kpiPct >= 50 ? AMBER : RED
                }}/>
            </div>
            <div className="hm-kpi-meter-labels">
              <span>{kpiOk} tercapai</span>
              <span style={{ color: RED }}>{kpiTotal - kpiOk} tidak tercapai</span>
            </div>
          </div>

          {/* Daftar KPI yang belum tercapai */}
          <div className="hm-kpi-list">
            {kpiTidak.length === 0
              ? <p className="hm-empty">Semua KPI tercapai!</p>
              : kpiTidak.map((k, i) => (
                  <div key={i} className="hm-kpi-item">
                    <Dot color={k.pct_tercapai === 0 ? RED : AMBER}/>
                    <div className="hm-kpi-item-body">
                      <p className="hm-kpi-item-name">{k.kpi}</p>
                      <p className="hm-kpi-item-target">{k.target_desc}</p>
                    </div>
                    <span className="hm-kpi-item-pct"
                      style={{ color: k.pct_tercapai === 0 ? RED : AMBER }}>
                      {fmtPct(k.pct_tercapai)}
                    </span>
                  </div>
                ))
            }
          </div>
        </div>

        {/* ── KOLOM TENGAH: Rekrutmen Funnel ─── */}
        <div className="hm-card">
          <SectionHeader
            title="Funnel Rekrutmen"
            subtitle={`${fmtNum(rcTotal)} total kandidat`}
            onClick={() => nav('recruitment')} linkLabel="Lihat semua →"
          />

          {/* Stats row */}
          <div className="hm-rc-stats">
            {[
              { label: 'On Process', val: onProcess, color: NAVY },
              { label: 'Accepted', val: accepted, color: GREEN },
              { label: 'Rejected', val: rejected, color: RED },
            ].map((s, i) => (
              <div key={i} className="hm-rc-stat">
                <p className="hm-rc-stat-val" style={{ color: s.color }}>{fmtNum(s.val)}</p>
                <p className="hm-rc-stat-lbl">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Funnel bars */}
          <div className="hm-funnel">
            {funnel.map((f, i) => {
              const colors = { 'on process': NAVY, accepted: GREEN, rejected: RED, mcu: AMBER, 'mengundurkan diri': ORANGE }
              const c = colors[f.status] || '#888'
              const w = maxFunnel > 0 ? Math.max((f.jumlah / maxFunnel) * 100, 4) : 0
              return (
                <div key={i} className="hm-funnel-row">
                  <span className="hm-funnel-lbl" style={{ textTransform: 'capitalize' }}>{f.status}</span>
                  <div className="hm-funnel-track">
                    <div className="hm-funnel-bar" style={{ width: `${w}%`, background: c }}/>
                  </div>
                  <span className="hm-funnel-val" style={{ color: c }}>{fmtNum(f.jumlah)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── KOLOM KANAN: Internship & Overtime ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Internship status */}
          <div className="hm-card hm-card--half">
            <SectionHeader
              title="Internship Berjalan"
              onClick={() => nav('internship')} linkLabel="Detail →"
            />
            <div className="hm-intern-grid">
              {[
                { label: 'Onboard', val: itOnboard, color: GREEN, bg: '#dcfce7' },
                { label: 'Butuh Balasan', val: itButuh, color: AMBER, bg: '#fef3c7', alert: itButuh > 0 },
                { label: 'Akan Berakhir', val: itBerakhir, color: RED, bg: '#f9e8e8', alert: itBerakhir > 0 },
                { label: 'Total', val: itTotal, color: NAVY, bg: '#e8e9f9' },
              ].map((s, i) => (
                <div key={i} className={`hm-intern-item${s.alert ? ' hm-intern-item--alert' : ''}`}
                  style={{ borderColor: s.alert ? s.color : 'transparent' }}>
                  <p className="hm-intern-val" style={{ color: s.color }}>{fmtNum(s.val)}</p>
                  <p className="hm-intern-lbl">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top overtime project */}
          <div className="hm-card hm-card--half">
            <SectionHeader
              title="Top Overtime per Project"
              onClick={() => nav('overtime')} linkLabel="Detail →"
            />
            <div className="hm-ot-list">
              {topOtProject.length === 0
                ? <p className="hm-empty">Tidak ada data</p>
                : topOtProject.map((p, i) => (
                    <div key={i} className="hm-ot-item">
                      <span className="hm-ot-rank">{i + 1}</span>
                      <span className="hm-ot-name">{p.project}</span>
                      <span className="hm-ot-pct"
                        style={{ color: p.overtime_percent > 30 ? RED : p.overtime_percent > 15 ? AMBER : GREEN }}>
                        {fmtPct(p.overtime_percent)}
                      </span>
                    </div>
                  ))
              }
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════
          BARIS 3 — Manpower Breakdown + BPJS
      ══════════════════════════════════════ */}
      <div className="hm-row2">

        {/* Manpower komposisi */}
        <div className="hm-card">
          <SectionHeader
            title="Komposisi Karyawan"
            subtitle="Status kontrak saat ini"
            onClick={() => nav('manpower')} linkLabel="Detail →"
          />
          <div className="hm-mp-bars">
            {[
              { label: 'Permanent', val: permanent, pct: pctPerm, color: GREEN },
              { label: 'Kontrak',   val: kontrak,   pct: totalKary ? Math.round(kontrak / totalKary * 100) : 0, color: AMBER },
            ].map((b, i) => (
              <div key={i} className="hm-mp-row">
                <div className="hm-mp-meta">
                  <span className="hm-mp-lbl">{b.label}</span>
                  <span className="hm-mp-count">{fmtNum(b.val)} <span style={{ color: b.color, fontWeight: 600 }}>({b.pct}%)</span></span>
                </div>
                <div className="hm-mp-track">
                  <div className="hm-mp-fill" style={{ width: `${b.pct}%`, background: b.color }}/>
                </div>
              </div>
            ))}

            {/* Group project top 5 */}
            {(mp?.group_project || []).slice(0, 5).map((g, i) => {
              const pct = totalKary ? Math.round(g.jumlah / totalKary * 100) : 0
              return (
                <div key={i} className="hm-mp-row hm-mp-row--sm">
                  <div className="hm-mp-meta">
                    <span className="hm-mp-lbl hm-mp-lbl--sm">{g.group_project}</span>
                    <span className="hm-mp-count hm-mp-count--sm">{fmtNum(g.jumlah)}</span>
                  </div>
                  <div className="hm-mp-track hm-mp-track--sm">
                    <div className="hm-mp-fill" style={{ width: `${pct}%`, background: NAVY, opacity: 0.5 + (i * 0.1) }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* BPJS breakdown */}
        <div className="hm-card">
          <SectionHeader
            title="Status BPJS"
            subtitle="Pembayaran & peserta terdaftar"
            onClick={() => nav('bpjs')} linkLabel="Detail →"
          />
          <div className="hm-bpjs-grid">
            {[
              { label: 'Kesehatan', val: bp?.kpi?.bpjs_kesehatan, color: GREEN, bg: '#dcfce7' },
              { label: 'TK Permanent', val: bp?.kpi?.bpjs_tk_permanent, color: NAVY, bg: '#e8e9f9' },
              { label: 'TK Borongan', val: bp?.kpi?.bpjs_tk_borongan, color: ORANGE, bg: '#fff3e0' },
              { label: 'Total Semua', val: bp?.kpi?.total_semua, color: RED, bg: '#f9e8e8' },
            ].map((b, i) => (
              <div key={i} className="hm-bpjs-item">
                <p className="hm-bpjs-lbl">{b.label}</p>
                <p className="hm-bpjs-val" style={{ color: b.color }}>{fmtRp(b.val)}</p>
              </div>
            ))}
          </div>
          <div className="hm-bpjs-footer">
            <span className="hm-bpjs-footer-lbl">Peserta terdaftar</span>
            <span className="hm-bpjs-footer-val">{fmtNum(totalBpjs)} orang</span>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════
          TIMESTAMP
      ══════════════════════════════════════ */}
      <p className="hm-timestamp">
        Data diambil dari sistem · {new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
      </p>

    </div>
  )
}

export default memo(Home)
