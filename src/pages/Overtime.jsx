import { useState, useEffect, memo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import './Overtime.css'

const API_URL = 'http://127.0.0.1:5000/overtime/dashboard'
const NAVY = '#060771'
const RED = '#BF1A1A'
const AMBER = '#b45309'

const fmt = n =>
  new Intl.NumberFormat('id-ID', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(n)

const fmtFull = n => 'Rp ' + new Intl.NumberFormat('id-ID').format(n)

const fmtDec = n => Number(n).toFixed(1)

const CT = ({ active, payload, label, money = false }) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: '#fff',
        border: '0.5px solid rgba(0,0,0,0.1)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      {label && (
        <p style={{ fontWeight: 600, color: NAVY, marginBottom: 4 }}>{label}</p>
      )}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || NAVY, margin: '2px 0' }}>
          {p.name}:{' '}
          <strong>{money ? fmtFull(p.value) : fmtDec(p.value)}</strong>
        </p>
      ))}
    </div>
  )
}
const CTMoney = props => <CT {...props} money />

function Overtime() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = () => {
    setLoading(true)
    fetch(API_URL)
      .then(r => {
        if (!r.ok) throw new Error('Gagal mengambil data')
        return r.json()
      })
      .then(j => {
        setData(j)
        setError(null)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading)
    return (
      <div className="ot-wrap">
        <div className="ot-loading">
          <div className="ot-spin" />
          <p>Memuat data...</p>
        </div>
      </div>
    )
  if (error)
    return (
      <div className="ot-wrap">
        <div className="ot-err">
          <p>Gagal: {error}</p>
          <button onClick={fetchData}>Coba lagi</button>
        </div>
      </div>
    )
  if (!data) return null

  const {
    kpi,
    overtime_trend,
    absensi_trend,
    overtime_project,
    overtime_cost,
  } = data

  // Gabungkan overtime trend + cost untuk composed chart
  const trendMap = {}
  ;(overtime_trend || []).forEach(d => {
    trendMap[d.bulan] = { bulan: d.bulan, overtime: d.overtime, cost: 0 }
  })
  ;(overtime_cost || []).forEach(d => {
    if (trendMap[d.bulan]) trendMap[d.bulan].cost = d.overtime_cost
    else trendMap[d.bulan] = { bulan: d.bulan, overtime: 0, cost: d.overtime_cost }
  })
  const combinedTrend = Object.values(trendMap).sort((a, b) =>
    a.bulan.localeCompare(b.bulan)
  )

  // Ambil 10 proyek teratas berdasarkan jam lembur
  const topProjects = [...(overtime_project || [])]
    .sort((a, b) => b.overtime - a.overtime)
    .slice(0, 10)

  return (
    <div className="ot-wrap">
      {/* Info bar */}
      <div className="ot-info-bar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke={NAVY} strokeWidth="1.8" fill="none" />
          <path d="M12 8v4M12 16h.01" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span>Data menampilkan seluruh periode yang tersedia</span>
      </div>

      {/* KPI Cards */}
      <div className="ot-kpi-grid">
        <div className="ot-kcard ot-kcard--jam">
          <div className="ot-kico" style={{ background: '#e8e9f9' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke={NAVY} strokeWidth="2" fill="none" />
              <path d="M12 7v5l3 3" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="ot-klbl">Rata-rata Overtime</p>
            <p className="ot-kval">
              {fmtDec(kpi?.avg_overtime || 0)}{' '}
              <span className="ot-kunit">jam/bulan</span>
            </p>
          </div>
        </div>

        <div className="ot-kcard ot-kcard--jam">
          <div className="ot-kico" style={{ background: '#fef3c7' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke={AMBER} strokeWidth="1.8" fill="none" />
              <path d="M3 9h18" stroke={AMBER} strokeWidth="1.5" />
              <path d="M8 2v3M16 2v3" stroke={AMBER} strokeWidth="1.8" strokeLinecap="round" />
              <path d="M8 14h2M12 14h2" stroke={AMBER} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="ot-klbl">Rata-rata Absensi</p>
            <p className="ot-kval">
              {fmtDec(kpi?.avg_absensi || 0)}{' '}
              <span className="ot-kunit">hari/bulan</span>
            </p>
          </div>
        </div>

        <div className="ot-kcard ot-kcard--cost">
          <div className="ot-kico" style={{ background: '#f9e8e8' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="6" width="20" height="13" rx="2" fill={RED} opacity=".8" />
              <path d="M8 12h2M14 12h2M12 9v6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="ot-klbl">Total Cost</p>
            <p className="ot-kval ot-kval--money">{fmtFull(kpi?.total_cost || 0)}</p>
          </div>
        </div>

        <div className="ot-kcard ot-kcard--cost">
          <div className="ot-kico" style={{ background: '#fff3e0' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 17l5-5 4 4 7-8" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <div>
            <p className="ot-klbl">Overtime Cost</p>
            <p className="ot-kval ot-kval--money" style={{ color: '#ea580c' }}>
              {fmtFull(kpi?.overtime_cost || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="ot-card">
        <p className="ot-ctitle">Tren Overtime & Biaya per Bulan</p>
        <p className="ot-cdesc">
          Rata‑rata jam lembur (area biru) dibandingkan dengan biaya overtime (area merah) tiap bulan
        </p>
        {combinedTrend.length === 0 ? (
          <p className="ot-nodata">Tidak ada data</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={combinedTrend}
              margin={{ top: 8, right: 24, left: 10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false} />
              <XAxis
                dataKey="bulan"
                tick={{ fontSize: 11, fill: '#888' }}
                angle={-35}
                textAnchor="end"
                height={60}
                axisLine={false}
                tickLine={false}
              />
              {/* Sumbu Y kiri untuk Overtime (jam) */}
              <YAxis
                yAxisId="ot"
                tick={{ fontSize: 10, fill: '#888' }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'Jam',
                  angle: -90,
                  position: 'insideLeft',
                  fontSize: 10,
                  fill: '#aaa',
                }}
              />
              {/* Sumbu Y kanan untuk Biaya (Rp) */}
              <YAxis
                yAxisId="cost"
                orientation="right"
                tick={{ fontSize: 10, fill: '#888' }}
                tickFormatter={v => fmt(v)}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CT />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {/* Area untuk Overtime (jam) */}
              <Area
                yAxisId="ot"
                type="monotone"
                dataKey="overtime"
                name="Rata-rata OT (jam)"
                stroke={NAVY}
                strokeWidth={2}
                fill={NAVY}
                fillOpacity={0.2}
                dot={{ r: 3, fill: NAVY, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              {/* Area untuk Biaya OT */}
              <Area
                yAxisId="cost"
                type="monotone"
                dataKey="cost"
                name="Biaya OT"
                stroke={RED}
                strokeWidth={2}
                fill={RED}
                fillOpacity={0.15}
                dot={{ r: 3, fill: RED, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Row 2 kolom: Top Project & Tren Absensi */}
      <div className="ot-row2">
        {/* Kolom Kiri: Top Project */}
        <div className="ot-card">
          <p className="ot-ctitle">Top 10 Project – Rata‑rata Overtime</p>
          <p className="ot-cdesc">Project dengan jam lembur rata‑rata tertinggi</p>
          {topProjects.length === 0 ? (
            <p className="ot-nodata">Tidak ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(240, topProjects.length * 36)}>
              <BarChart
                data={topProjects}
                layout="vertical"
                barCategoryGap="28%"
                margin={{ top: 0, right: 60, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#888' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="project"
                  tick={{ fontSize: 11, fill: '#444' }}
                  width={120}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CT />} />
                <Bar
                  dataKey="overtime"
                  name="OT (jam)"
                  fill={NAVY}
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                  label={{
                    position: 'right',
                    fontSize: 11,
                    fill: NAVY,
                    fontWeight: 600,
                    formatter: v => fmtDec(v),
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Kolom Kanan: Tren Absensi */}
        <div className="ot-card">
          <p className="ot-ctitle">Tren Absensi per Bulan</p>
          <p className="ot-cdesc">Rata‑rata hari absensi karyawan setiap bulan</p>
          {(absensi_trend || []).length === 0 ? (
            <p className="ot-nodata">Tidak ada data</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart
                data={absensi_trend}
                margin={{ top: 8, right: 16, left: 0, bottom: 40 }}
              >
                <defs>
                  <linearGradient id="gOtAbs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={AMBER} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={AMBER} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false} />
                <XAxis
                  dataKey="bulan"
                  tick={{ fontSize: 11, fill: '#888' }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CT />} />
                <Area
                  type="monotone"
                  dataKey="absensi"
                  name="Absensi (hari)"
                  stroke={AMBER}
                  strokeWidth={2}
                  fill="url(#gOtAbs)"
                  dot={{ r: 3, fill: AMBER, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(Overtime)