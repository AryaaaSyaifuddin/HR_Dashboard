import {
  LineChart, Line,
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { memo } from 'react'
import LazyChartCard from '../components/LazyChartCard'
import './ManPower.css'

/* =====================
   DATA DUMMY
   ===================== */
const dataManpowerTrend = [
  { bulan: 'Jan', tetap: 180, kontrak: 85, probasi: 28 },
  { bulan: 'Feb', tetap: 185, kontrak: 88, probasi: 30 },
  { bulan: 'Mar', tetap: 195, kontrak: 92, probasi: 32 },
  { bulan: 'Apr', tetap: 200, kontrak: 95, probasi: 35 },
  { bulan: 'Mei', tetap: 205, kontrak: 98, probasi: 33 },
  { bulan: 'Jun', tetap: 210, kontrak: 100, probasi: 31 },
]

const dataStatusKaryawan = [
  { name: 'Tetap',   value: 210 },
  { name: 'Kontrak', value: 100 },
  { name: 'Probasi', value: 31  },
]

const dataDepartemen = [
  { dept: 'Produksi',    tetap: 95, kontrak: 35, probasi: 12 },
  { dept: 'IT',          tetap: 38, kontrak: 12, probasi: 5 },
  { dept: 'Finance',     tetap: 30, kontrak: 8,  probasi: 3 },
  { dept: 'Marketing',   tetap: 24, kontrak: 6,  probasi: 2 },
  { dept: 'HR',          tetap: 18, kontrak: 5,  probasi: 2 },
  { dept: 'Operasional', tetap: 5,  kontrak: 34, probasi: 7 },
]

const RED  = '#BF1A1A'
const NAVY = '#060771'
const ORANGE = '#FF9500'
const PIE_COLORS = [NAVY, RED, ORANGE]

/* =====================
   KPI CARD
   ===================== */
function KPICard({ label, value, subtitle, color }) {
  return (
    <div className="kpi-card" style={{ borderLeftColor: color }}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      {subtitle && <p className="kpi-subtitle">{subtitle}</p>}
    </div>
  )
}

/* =====================
   FILTER SECTION
   ===================== */
function FilterSection() {
  return (
    <div className="filter-section">
      <h3>Filter</h3>
      <div className="filter-row">
        <div className="filter-group">
          <label>Departemen</label>
          <select>
            <option>Semua</option>
            <option>Produksi</option>
            <option>IT</option>
            <option>Finance</option>
            <option>Marketing</option>
            <option>HR</option>
            <option>Operasional</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select>
            <option>Semua</option>
            <option>Tetap</option>
            <option>Kontrak</option>
            <option>Probasi</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Bulan</label>
          <select>
            <option>Jan</option>
            <option>Feb</option>
            <option>Mar</option>
            <option>Apr</option>
            <option>Mei</option>
            <option>Jun</option>
          </select>
        </div>
        <button className="filter-btn">Terapkan Filter</button>
      </div>
    </div>
  )
}

/* =====================
   KOMPONEN UTAMA
   ===================== */
function ManPower() {
  return (
    <div className="manpower-wrapper">
      
      {/* Filter Section */}
      <FilterSection />

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard 
          label="Total Karyawan" 
          value="341" 
          subtitle="↑ 5 bulan ini"
          color={NAVY}
        />
        <KPICard 
          label="Karyawan Tetap" 
          value="210" 
          subtitle="61.6% dari total"
          color={RED}
        />
        <KPICard 
          label="Karyawan Kontrak" 
          value="100" 
          subtitle="29.3% dari total"
          color={ORANGE}
        />
      </div>

      {/* Charts Row 1: Line + Pie */}
      <div className="chart-row-2">
        <LazyChartCard 
          title="Tren Karyawan per Status"
          desc="Perkembangan jumlah karyawan berdasarkan status kontrak dari Januari hingga Juni 2026"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dataManpowerTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tetap" name="Tetap" stroke={NAVY} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="kontrak" name="Kontrak" stroke={RED} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="probasi" name="Probasi" stroke={ORANGE} strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </LazyChartCard>

        <LazyChartCard 
          title="Komposisi Status Karyawan"
          desc="Perbandingan jumlah karyawan berdasarkan status kontrak saat ini"
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={dataStatusKaryawan}
                cx="50%" cy="50%"
                outerRadius={80}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {dataStatusKaryawan.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </LazyChartCard>
      </div>

      {/* Charts Row 2: Bar Chart Full Width */}
      <div className="chart-row-1">
        <LazyChartCard 
          title="Distribusi Karyawan per Departemen"
          desc="Sebaran karyawan menurut status di setiap departemen"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dataDepartemen}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="tetap" name="Tetap" fill={NAVY} radius={[4,4,0,0]} />
              <Bar dataKey="kontrak" name="Kontrak" fill={RED} radius={[4,4,0,0]} />
              <Bar dataKey="probasi" name="Probasi" fill={ORANGE} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </LazyChartCard>
      </div>

    </div>
  )
}

export default memo(ManPower)
