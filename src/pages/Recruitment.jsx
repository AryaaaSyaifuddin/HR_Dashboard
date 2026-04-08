import {
  LineChart, Line,
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { memo } from 'react'
import LazyChartCard from '../components/LazyChartCard'
import './Recruitment.css'

/* =====================
   DATA DUMMY
   ===================== */
const dataRecruitmentTrend = [
  { bulan: 'Jan', total: 15, completed: 8, pipeline: 4, interview: 2, rejected: 1 },
  { bulan: 'Feb', total: 18, completed: 10, pipeline: 5, interview: 2, rejected: 1 },
  { bulan: 'Mar', total: 22, completed: 12, pipeline: 7, interview: 2, rejected: 1 },
  { bulan: 'Apr', total: 20, completed: 11, pipeline: 6, interview: 2, rejected: 1 },
  { bulan: 'Mei', total: 25, completed: 14, pipeline: 8, interview: 2, rejected: 1 },
  { bulan: 'Jun', total: 28, completed: 16, pipeline: 9, interview: 2, rejected: 1 },
]

const statusRecruitment = [
  { name: 'Completed',  value: 16 },
  { name: 'Pipeline',   value: 9  },
  { name: 'Interview',  value: 2  },
  { name: 'Rejected',   value: 1  },
]

const dataByRoles = [
  { role: 'Frontend Dev', target: 8, recruited: 5, pending: 3 },
  { role: 'Backend Dev', target: 8, recruited: 6, pending: 2 },
  { role: 'QA Engineer', target: 4, recruited: 2, pending: 2 },
  { role: 'Product Manager', target: 3, recruited: 2, pending: 1 },
  { role: 'UI/UX Designer', target: 3, recruited: 1, pending: 2 },
]

const RED  = '#BF1A1A'
const NAVY = '#060771'
const GREEN = '#10B981'
const ORANGE = '#FF9500'
const PIE_COLORS = [GREEN, ORANGE, '#F59E0B', RED]

/* =====================
   KPI CARD
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
function FilterSection() {
  return (
    <div className="filter-section-recruitment">
      <h3>Filter</h3>
      <div className="filter-row">
        <div className="filter-group">
          <label>Status</label>
          <select>
            <option>Semua</option>
            <option>Completed</option>
            <option>Pipeline</option>
            <option>Interview</option>
            <option>Rejected</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Posisi</label>
          <select>
            <option>Semua</option>
            <option>Frontend Dev</option>
            <option>Backend Dev</option>
            <option>QA Engineer</option>
            <option>Product Manager</option>
            <option>UI/UX Designer</option>
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
function Recruitment() {
  return (
    <div className="recruitment-wrapper">
      
      {/* Filter Section */}
      <FilterSection />

      {/* KPI Cards - 5 columns */}
      <div className="kpi-grid-5">
        <KPICard 
          label="Total Recruitment" 
          value="128" 
          subtitle="↑ dari 6 bulan"
          color={NAVY}
        />
        <KPICard 
          label="Completed" 
          value="73" 
          subtitle="57% dari total"
          color={GREEN}
        />
        <KPICard 
          label="Pipeline" 
          value="39" 
          subtitle="31% dari total"
          color={ORANGE}
        />
        <KPICard 
          label="Interview" 
          value="12" 
          subtitle="9% dari total"
          color="#F59E0B"
        />
        <KPICard 
          label="Rejected" 
          value="4" 
          subtitle="3% dari total"
          color={RED}
        />
      </div>

      {/* Charts Row 1: Line + Pie */}
      <div className="chart-row-recruitment">
        <div className="chart-col-large">
          <LazyChartCard 
            title="Tren Recruitment per Bulan"
            desc="Perkembangan jumlah recruitment berdasarkan status dari Januari hingga Juni 2026"
          >
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={dataRecruitmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" name="Total" stroke={NAVY} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke={GREEN} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="pipeline" name="Pipeline" stroke={ORANGE} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </LazyChartCard>
        </div>

        <div className="chart-col-small">
          <LazyChartCard 
            title="Status Recruitment"
            desc="Distribusi status recruitment saat ini"
          >
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={statusRecruitment}
                  cx="50%" cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusRecruitment.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </LazyChartCard>
        </div>
      </div>

      {/* Charts Row 2: Bar Chart Full Width */}
      <div className="chart-row-full">
        <LazyChartCard 
          title="Recruitment Progress per Role"
          desc="Target vs Recruited untuk setiap posisi"
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dataByRoles}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="role" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="target" name="Target" fill={NAVY} radius={[4,4,0,0]} />
              <Bar dataKey="recruited" name="Recruited" fill={GREEN} radius={[4,4,0,0]} />
              <Bar dataKey="pending" name="Pending" fill={ORANGE} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </LazyChartCard>
      </div>

    </div>
  )
}

export default memo(Recruitment)
