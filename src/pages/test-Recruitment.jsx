import {
  LineChart, Line,
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { memo, useState, useEffect, useCallback } from 'react'
import LazyChartCard from '../components/LazyChartCard'
import './Recruitment.css'

/* =====================
   CONSTANTS & COLORS
   ===================== */
const API_URL = 'http://127.0.0.1:5000/recruitment/dashboard'

const RED    = '#BF1A1A'
const NAVY   = '#060771'
const GREEN  = '#10B981'
const ORANGE = '#FF9500'
const BLUE   = '#3B82F6'
const PURPLE = '#8B5CF6'

const PIE_COLORS = [GREEN, BLUE, ORANGE, RED, PURPLE]

/* =====================
   KPI CARD COMPONENT
   ===================== */
function KPICard({ label, value, subtitle, color }) {
  return (
    <div className="kpi-card-recruitment" style={{ borderLeftColor: color }}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
    </div>
  )
}

/* =====================
   FILTER SECTION
   ===================== */
function FilterSection({ filters, onFilterChange, onApply }) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleChange = (e) => {
    const { name, value } = e.target
    setLocalFilters(prev => ({ ...prev, [name]: value }))
  }

  const handleApply = () => {
    onApply(localFilters)
  }

  return (
    <div className="filter-section-recruitment">
      <h3>Filter</h3>
      <div className="filter-row">
        <div className="filter-group">
          <label>Status</label>
          <select name="status" value={localFilters.status} onChange={handleChange}>
            <option value="">Semua</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="on process">On Process</option>
            <option value="mcu">MCU</option>
            <option value="mengundurkan diri">Mengundurkan Diri</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Posisi</label>
          <select name="posisi" value={localFilters.posisi} onChange={handleChange}>
            <option value="">Semua</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="QA Engineer">QA Engineer</option>
            <option value="Product Manager">Product Manager</option>
            <option value="UI/UX Designer">UI/UX Designer</option>
            {/* Tambahkan opsi lain sesuai data aktual */}
          </select>
        </div>

        <div className="filter-group">
          <label>Bulan Mulai</label>
          <input
            type="month"
            name="startMonth"
            value={localFilters.startMonth}
            onChange={handleChange}
          />
        </div>

        <div className="filter-group">
          <label>Bulan Akhir</label>
          <input
            type="month"
            name="endMonth"
            value={localFilters.endMonth}
            onChange={handleChange}
          />
        </div>

        <button className="filter-btn" onClick={handleApply}>
          Terapkan Filter
        </button>
      </div>
    </div>
  )
}

/* =====================
   FUNNEL BAR (Horizontal)
   ===================== */
function FunnelChart({ data }) {
  if (!data || data.length === 0) return null

  return (
    <LazyChartCard
      title="Funnel Rekrutmen"
      desc="Tahapan dari On Process hingga Accepted / Rejected"
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          layout="vertical"
          data={data}
          margin={{ left: 100 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="status" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="jumlah" fill={NAVY} radius={[0, 4, 4, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </LazyChartCard>
  )
}

/* =====================
   MAIN COMPONENT
   ===================== */
function Recruitment() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState(null)

  // Filter state (dikirim ke API)
  const [filters, setFilters] = useState({
    status: '',
    posisi: '',
    startMonth: '',
    endMonth: ''
  })

  // Konversi bulan input (YYYY-MM) ke tanggal (YYYY-MM-DD) untuk API
  const formatDateParam = (monthStr) => {
    if (!monthStr) return null
    return `${monthStr}-01` // awal bulan
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (filters.status) params.append('status', filters.status)
      if (filters.posisi) params.append('posisi', filters.posisi)

      const start = formatDateParam(filters.startMonth)
      const end = formatDateParam(filters.endMonth)
      if (start && end) {
        params.append('start', start)
        params.append('end', end)
      }

      const url = `${API_URL}${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Gagal mengambil data')
      const json = await res.json()
      setDashboardData(json)
      setError(null)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApplyFilter = (newFilters) => {
    setFilters(newFilters)
  }

  // --- Render loading / error ---
  if (loading) {
    return <div className="recruitment-wrapper">Memuat data...</div>
  }

  if (error) {
    return <div className="recruitment-wrapper">Error: {error}</div>
  }

  if (!dashboardData) {
    return <div className="recruitment-wrapper">Tidak ada data</div>
  }

  const { kpi, status, posisi, trend, funnel } = dashboardData

  // Hitung persentase untuk subtitle KPI (opsional)
  const total = kpi?.total || 0
  const acceptedPercent = total ? ((kpi.accepted / total) * 100).toFixed(1) : '0'
  const onProcessPercent = total ? ((kpi.on_process / total) * 100).toFixed(1) : '0'
  const rejectedPercent = total ? ((kpi.rejected / total) * 100).toFixed(1) : '0'

  return (
    <div className="recruitment-wrapper">
      
      {/* Filter Section */}
      <FilterSection 
        filters={filters} 
        onFilterChange={() => {}} 
        onApply={handleApplyFilter} 
      />

      {/* KPI Cards - 4 kolom karena API hanya beri 4 metrik */}
      <div className="kpi-grid-4">
        <KPICard 
          label="Total Kandidat" 
          value={total}
          color={NAVY}
        />
        <KPICard 
          label="Accepted" 
          value={kpi.accepted}
          subtitle={`${acceptedPercent}% dari total`}
          color={GREEN}
        />
        <KPICard 
          label="On Process" 
          value={kpi.on_process}
          subtitle={`${onProcessPercent}% dari total`}
          color={ORANGE}
        />
        <KPICard 
          label="Rejected" 
          value={kpi.rejected}
          subtitle={`${rejectedPercent}% dari total`}
          color={RED}
        />
      </div>

      {/* Charts Row 1: Line (Trend) + Pie (Status) */}
      <div className="chart-row-recruitment">
        <div className="chart-col-large">
          <LazyChartCard 
            title="Tren Total Rekrutmen per Bulan"
            desc="Jumlah kandidat yang masuk proses rekrutmen setiap bulan"
          >
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="jumlah" 
                  name="Total Kandidat" 
                  stroke={NAVY} 
                  strokeWidth={3} 
                  dot={{ r: 4 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </LazyChartCard>
        </div>

        <div className="chart-col-small">
          <LazyChartCard 
            title="Distribusi Status"
            desc="Status terkini seluruh kandidat"
          >
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={status || []}
                  cx="50%" cy="50%"
                  outerRadius={80}
                  dataKey="jumlah"
                  nameKey="status"
                  label={({ status, percent }) => 
                    `${status} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {(status || []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </LazyChartCard>
        </div>
      </div>

      {/* Charts Row 2: Bar Chart per Posisi */}
      <div className="chart-row-full">
        <LazyChartCard 
          title="Jumlah Kandidat per Posisi"
          desc="Total pelamar untuk setiap posisi yang tersedia"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={posisi || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="posisi" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar 
                dataKey="jumlah" 
                name="Jumlah Kandidat" 
                fill={NAVY} 
                radius={[4, 4, 0, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </LazyChartCard>
      </div>

      {/* Charts Row 3: Funnel (Horizontal Bar) */}
      <div className="chart-row-full">
        <FunnelChart data={funnel || []} />
      </div>

    </div>
  )
}

export default memo(Recruitment)