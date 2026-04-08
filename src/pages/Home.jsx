import StatCard from '../components/StatCard.jsx'
import './Home.css'

/* Data dummy untuk aktivitas terbaru */
const ACTIVITIES = [
  { id: 1, label: 'Andi Pratama — Kontrak diperpanjang',    status: 'Selesai',  color: 'green' },
  { id: 2, label: 'Rekrutmen Staff IT — Interview tahap 2', status: 'Proses',   color: 'red'   },
  { id: 3, label: 'Training K3 — 18 peserta terdaftar',     status: 'Terdaftar',color: 'navy'  },
  { id: 4, label: 'Payroll April — Menunggu approval',       status: 'Pending',  color: 'red'   },
]

/* Data dummy untuk bar chart rekrutmen */
const BAR_DATA = [
  { dept: 'Prod', value: 14, pct: 100 },
  { dept: 'IT',   value: 10, pct: 71  },
  { dept: 'HR',   value: 8,  pct: 57  },
  { dept: 'Fin',  value: 12, pct: 86  },
  { dept: 'Ops',  value: 6,  pct: 43  },
  { dept: 'Mktg', value: 9,  pct: 64  },
]

export default function Home() {
  return (
    <div>

      {/* === STAT CARDS === */}
      <div className="stat-grid">
        {/*
          Menggunakan komponen StatCard yang sudah dibuat.
          Setiap kartu hanya perlu mengisi props yang berbeda.
        */}
        <StatCard label="Total Karyawan"  value="324" sub="+8 bulan ini" subColor="green" barColor="red" />
        <StatCard label="Rekrutmen Aktif" value="12"  sub="4 posisi baru" subColor="green" barColor="navy" />
        <StatCard label="Magang Aktif"    value="27"  sub="−3 selesai"   subColor="red"   barColor="red" />
        <StatCard label="Lembur Bulan Ini" value="148" sub="jam total"   subColor="muted" barColor="navy" />
      </div>

      {/* === BARIS CHART + DONUT === */}
      <div className="chart-row">

        {/* Bar Chart */}
        <div className="card">
          <p className="card-title">Rekrutmen per Departemen — Q1 2026</p>
          <div className="bar-chart">
            {BAR_DATA.map((item) => (
              <div key={item.dept} className="bar-col">
                <span className="bar-value">{item.value}</span>
                <div
                  className="bar-fill"
                  style={{ height: `${item.pct}%` }}
                ></div>
                <span className="bar-label">{item.dept}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Karyawan */}
        <div className="card">
          <p className="card-title">Status Karyawan</p>
          <div className="status-list">
            <div className="status-item">
              <div className="status-dot" style={{ background: 'var(--red)' }}></div>
              <span className="status-label">Tetap</span>
              <span className="status-value">195 (60%)</span>
            </div>
            <div className="status-item">
              <div className="status-dot" style={{ background: 'var(--navy)' }}></div>
              <span className="status-label">Kontrak</span>
              <span className="status-value">97 (30%)</span>
            </div>
            <div className="status-item">
              <div className="status-dot" style={{ background: '#aaa' }}></div>
              <span className="status-label">Probasi</span>
              <span className="status-value">32 (10%)</span>
            </div>
            <div className="status-total">
              <span>Total</span>
              <strong>324 karyawan</strong>
            </div>
          </div>
        </div>

      </div>

      {/* === AKTIVITAS TERBARU === */}
      <div className="card">
        <p className="card-title">Aktivitas Terbaru</p>
        <div className="activity-list">
          {ACTIVITIES.map((item) => (
            <div key={item.id} className="activity-item">
              <div className="activity-left">
                <div
                  className="activity-dot"
                  style={{ background: item.color === 'navy' ? 'var(--navy)' : item.color === 'red' ? 'var(--red)' : '#16a34a' }}
                ></div>
                <span className="activity-label">{item.label}</span>
              </div>
              <span className={`badge badge--${item.color}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
