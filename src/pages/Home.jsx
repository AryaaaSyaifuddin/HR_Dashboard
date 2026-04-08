import {
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts'
import { memo } from 'react'
import './Home.css'

/* =====================
   DATA DUMMY
   (nanti ganti dengan data JSON dari Pandas)
   ===================== */

const dataMonthly = [
  { bulan: 'Jan', rekrutmen: 12, resign: 3 },
  { bulan: 'Feb', rekrutmen: 8,  resign: 5 },
  { bulan: 'Mar', rekrutmen: 15, resign: 2 },
  { bulan: 'Apr', rekrutmen: 10, resign: 4 },
  { bulan: 'Mei', rekrutmen: 18, resign: 6 },
  { bulan: 'Jun', rekrutmen: 7,  resign: 1 },
]

const dataKaryawan = [
  { bulan: 'Jan', total: 300 },
  { bulan: 'Feb', total: 305 },
  { bulan: 'Mar', total: 318 },
  { bulan: 'Apr', total: 316 },
  { bulan: 'Mei', total: 328 },
  { bulan: 'Jun', total: 324 },
]

const dataDept = [
  { dept: 'Produksi',   total: 98 },
  { dept: 'IT',         total: 42 },
  { dept: 'Finance',    total: 35 },
  { dept: 'Marketing',  total: 28 },
  { dept: 'HR',         total: 22 },
  { dept: 'Operasional',total: 19 },
]

const dataPie = [
  { name: 'Tetap',   value: 195 },
  { name: 'Kontrak', value: 97  },
  { name: 'Probasi', value: 32  },
]

const dataRadar = [
  { subject: 'Produktivitas', value: 80 },
  { subject: 'Kehadiran',     value: 92 },
  { subject: 'Target',        value: 75 },
  { subject: 'Kerjasama',     value: 88 },
  { subject: 'Inovasi',       value: 65 },
]

const dataComposed = [
  { bulan: 'Jan', jam: 120, biaya: 18 },
  { bulan: 'Feb', jam: 95,  biaya: 14 },
  { bulan: 'Mar', jam: 148, biaya: 22 },
  { bulan: 'Apr', jam: 110, biaya: 17 },
  { bulan: 'Mei', jam: 160, biaya: 25 },
  { bulan: 'Jun', jam: 130, biaya: 20 },
]

const dataTabel = [
  { nama: 'Andi Pratama',  dept: 'IT',        jabatan: 'Frontend Dev',  tgl: '01 Apr 2026', status: 'Aktif'   },
  { nama: 'Sari Dewi',     dept: 'HR',        jabatan: 'HR Specialist', tgl: '15 Mar 2026', status: 'Aktif'   },
  { nama: 'Budi Santoso',  dept: 'Finance',   jabatan: 'Akuntan',       tgl: '10 Mar 2026', status: 'Probasi' },
  { nama: 'Rina Kusuma',   dept: 'Marketing', jabatan: 'Copywriter',    tgl: '01 Mar 2026', status: 'Aktif'   },
  { nama: 'Doni Setiawan', dept: 'Produksi',  jabatan: 'Operator',      tgl: '20 Feb 2026', status: 'Kontrak' },
]

const RED  = '#BF1A1A'
const NAVY = '#060771'
const PIE_COLORS = [RED, NAVY, '#a0a0b0']

/* =====================
   KOMPONEN UTAMA
   ===================== */
function Home() {
  return (
    <div className="home-wrapper">

      <p className="section-label">Chart Gallery — Template Analisis</p>

      {/* ===== BARIS 1: Bar + Line ===== */}
      <div className="chart-row-2">

        <div className="chart-card">
          <p className="chart-title">1. Bar Chart — Rekrutmen vs Resign</p>
          <p className="chart-desc">Cocok untuk membandingkan 2 nilai per periode</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={dataMonthly} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="rekrutmen" name="Rekrutmen" fill={NAVY} radius={[4,4,0,0]} />
              <Bar dataKey="resign"    name="Resign"    fill={RED}  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="chart-title">2. Line Chart — Tren Rekrutmen</p>
          <p className="chart-desc">Cocok untuk melihat tren naik/turun dari waktu ke waktu</p>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={dataMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rekrutmen" name="Rekrutmen" stroke={NAVY} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="resign"    name="Resign"    stroke={RED}  strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ===== BARIS 2: Area + Horizontal Bar ===== */}
      <div className="chart-row-2">

        <div className="chart-card">
          <p className="chart-title">3. Area Chart — Pertumbuhan Karyawan</p>
          <p className="chart-desc">Seperti Line Chart tapi area diisi — lebih kuat untuk menunjukkan volume</p>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={dataKaryawan}>
              <defs>
                <linearGradient id="gradNavy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={NAVY} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={NAVY} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[290, 340]} />
              <Tooltip />
              <Area type="monotone" dataKey="total" name="Total Karyawan" stroke={NAVY} strokeWidth={2} fill="url(#gradNavy)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="chart-title">4. Horizontal Bar — Karyawan per Departemen</p>
          <p className="chart-desc">Cocok jika nama kategori panjang atau ingin tampilan ranking yang rapi</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={dataDept} layout="vertical" barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="dept" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="total" name="Jumlah" fill={RED} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ===== BARIS 3: Pie + Radar ===== */}
      <div className="chart-row-2">

        <div className="chart-card">
          <p className="chart-title">5. Pie Chart — Komposisi Status Karyawan</p>
          <p className="chart-desc">Cocok untuk proporsi / persentase dari keseluruhan</p>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie
                data={dataPie}
                cx="50%" cy="50%"
                outerRadius={75}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {dataPie.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <p className="chart-title">6. Radar Chart — KPI Multi-Aspek</p>
          <p className="chart-desc">Cocok untuk penilaian multi-dimensi seperti KPI atau evaluasi performa individu</p>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={dataRadar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Rata-rata" dataKey="value" stroke={NAVY} fill={NAVY} fillOpacity={0.25} strokeWidth={2} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ===== BARIS 4: Composed Chart ===== */}
      <div className="chart-row-1">
        <div className="chart-card">
          <p className="chart-title">7. Composed Chart — Jam Lembur & Biaya (Bar + Line digabung)</p>
          <p className="chart-desc">Cocok untuk dua metrik dengan satuan berbeda dalam satu tampilan — contoh: jam lembur vs biaya lembur</p>
          <ResponsiveContainer width="100%" height={210}>
            <ComposedChart data={dataComposed}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left"  tick={{ fontSize: 12 }} label={{ value: 'Jam', angle: -90, position: 'insideLeft', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} label={{ value: 'Biaya (jt)', angle: 90, position: 'insideRight', fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar  yAxisId="left"  dataKey="jam"   name="Jam Lembur" fill={NAVY} radius={[4,4,0,0]} />
              <Line yAxisId="right" dataKey="biaya" name="Biaya (jt)" stroke={RED} strokeWidth={2} dot={{ r: 4 }} type="monotone" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== BARIS 5: Tabel ===== */}
      <div className="chart-row-1">
        <div className="chart-card">
          <p className="chart-title">8. Tabel — Karyawan Terbaru Masuk</p>
          <p className="chart-desc">Cocok untuk data detail yang perlu dibaca baris per baris, bisa ditambah fitur sort & filter</p>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Departemen</th>
                  <th>Jabatan</th>
                  <th>Tgl Masuk</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dataTabel.map((row, i) => (
                  <tr key={i}>
                    <td>{row.nama}</td>
                    <td>{row.dept}</td>
                    <td>{row.jabatan}</td>
                    <td>{row.tgl}</td>
                    <td>
                      <span className={`badge badge--${
                        row.status === 'Aktif'   ? 'green' :
                        row.status === 'Probasi' ? 'navy'  : 'red'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  )
}

export default memo(Home)
