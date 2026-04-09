import './Placeholder.css'
import { useEffect, useState } from "react";
import axios from "axios";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const API_URL = "http://127.0.0.1:5000/internship/dashboard";
const COLORS = ["#060771", "#BF1A1A", "#a0a0b0", "#FF9800", "#4CAF50", "#2196F3", "#9C27B0"];

export default function Internship() {
  // =========================
  // STATE DATA
  // =========================
  const [data, setData] = useState({
    kpi: {
      onboard: 0,
      butuh_surat_balasan: 0,
      ajukan_ulang: 0,
      selesai: 0,
      akan_berakhir: 0,
      total: 0
    },
    institusi: [],
    permohonan: [],
    penempatan: [],
    ket: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // =========================
  // STATE FILTER
  // =========================
  const [filters, setFilters] = useState({
    institusi: "",
    penempatan: "",
    status: "",
    start: "",
    end: ""
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);

  const [filterOptions, setFilterOptions] = useState({
    institusi: [],
    penempatan: [],
    status: ["onboard", "butuh surat balasan", "ajukan ulang", "selesai"]
  });

  // =========================
  // FETCH DATA DARI BACKEND
  // =========================
  const fetchDashboard = (queryParams = {}) => {
    setLoading(true);
    
    // Build query string
    const params = new URLSearchParams();
    if (queryParams.institusi) params.append("institusi", queryParams.institusi);
    if (queryParams.penempatan) params.append("penempatan", queryParams.penempatan);
    if (queryParams.status) params.append("status", queryParams.status);
    if (queryParams.start) params.append("start", queryParams.start);
    if (queryParams.end) params.append("end", queryParams.end);

    const url = params.toString() ? `${API_URL}?${params}` : API_URL;

    axios
      .get(url)
      .then(res => {
        console.log("✅ Data dashboard berhasil diambil:", res.data);
        setData(res.data);
        setError(null);
      })
      .catch(err => {
        console.error("❌ Error fetch dashboard:", err.message);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  // =========================
  // INITIAL LOAD & GET FILTER OPTIONS
  // =========================
  useEffect(() => {
    fetchDashboard();
  }, []);

  // Load filter options (institusi & penempatan) dari backend (tanpa filter)
  useEffect(() => {
    axios
      .get(API_URL)
      .then(res => {
        const inst = res.data.institusi.map(item => item.institusi);
        const penem = res.data.penempatan.map(item => item.penempatan);
        
        setFilterOptions(prev => ({
          ...prev,
          institusi: inst,
          penempatan: penem
        }));
      })
      .catch(err => console.error("❌ Error loading filter options:", err.message));
  }, []);

  // =========================
  // HANDLE FILTER CHANGE
  // =========================
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // =========================
  // APPLY FILTER
  // =========================
  const applyFilters = () => {
    console.log("🔍 Applying filters:", filters);
    fetchDashboard(filters);
  };

  // =========================
  // RESET FILTER
  // =========================
  const resetFilters = () => {
    setFilters({
      institusi: "",
      penempatan: "",
      status: "",
      start: "",
      end: ""
    });
    fetchDashboard();
  };

  // =========================
  // RENDER LOADING/ERROR
  // =========================
  if (loading) {
    return (
      <div className="internship-wrapper">
        <p className="section-label">Dashboard Internship</p>
        <p style={{ color: "#666" }}>⏳ Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="internship-wrapper">
        <p className="section-label">Dashboard Internship</p>
        <p style={{ color: "#d32f2f" }}>❌ Error: {error}</p>
      </div>
    );
  }

  const totalIntern = data.kpi.total || 0;
  const toPercent = (value) => {
    if (!totalIntern) return 0;
    return Math.round(((value || 0) / totalIntern) * 100);
  };
  const sortedInstitusi = [...data.institusi].sort((a, b) => (b.jumlah || 0) - (a.jumlah || 0));
  const topInstitusi = sortedInstitusi.slice(0, 8);

  return (
    <div className="internship-wrapper">

      {/* ===== FILTER — compact, satu baris ===== */}
      <div className="ifilter-bar">
        <div className="ifilter-inner">

          {/* Filter Institusi */}
          <div className="ifilter-group">
            <label className="ifilter-label">Institusi</label>
            <select
              className="ifilter-select"
              value={filters.institusi}
              onChange={(e) => handleFilterChange("institusi", e.target.value)}
            >
              <option value="">Semua</option>
              {filterOptions.institusi.map((inst, idx) => (
                <option key={idx} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          <div className="ifilter-divider" />

          {/* Filter Penempatan */}
          <div className="ifilter-group">
            <label className="ifilter-label">Penempatan</label>
            <select
              className="ifilter-select"
              value={filters.penempatan}
              onChange={(e) => handleFilterChange("penempatan", e.target.value)}
            >
              <option value="">Semua Divisi</option>
              {filterOptions.penempatan.map((penem, idx) => (
                <option key={idx} value={penem}>{penem}</option>
              ))}
            </select>
          </div>

          <div className="ifilter-divider" />

          {/* Filter Status */}
          <div className="ifilter-group">
            <label className="ifilter-label">Status</label>
            <select
              className="ifilter-select"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">Semua Status</option>
              {filterOptions.status.map((stat, idx) => (
                <option key={idx} value={stat}>
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="ifilter-divider" />

          {/* Filter Tanggal */}
          <div className="ifilter-group ifilter-group--date">
            <label className="ifilter-label">Periode</label>
            <input
              type="text"
              className="ifilter-select"
              value={
                dateRange[0] && dateRange[1]
                  ? `${dateRange[0].toLocaleDateString('id-ID')} – ${dateRange[1].toLocaleDateString('id-ID')}`
                  : dateRange[0]
                  ? dateRange[0].toLocaleDateString('id-ID')
                  : "Semua tanggal"
              }
              readOnly
              onClick={() => setShowDatePicker(!showDatePicker)}
              style={{ cursor: 'pointer', minWidth: 160 }}
            />
            {showDatePicker && (
              <div className="date-picker-wrapper">
                <Calendar
                  selectRange={true}
                  value={dateRange}
                  onChange={(value) => {
                    setDateRange(value);
                    if (value[0] && value[1]) {
                      const startDate = value[0].toISOString().split('T')[0];
                      const endDate = value[1].toISOString().split('T')[0];
                      setFilters(prev => ({ ...prev, start: startDate, end: endDate }));
                      setTimeout(() => setShowDatePicker(false), 200);
                    }
                  }}
                />
              </div>
            )}
          </div>

        </div>

        {/* Tombol aksi */}
        <div className="ifilter-actions">
          <button className="ifilter-reset" onClick={resetFilters}>Reset</button>
          <button className="ifilter-apply" onClick={applyFilters}>Terapkan</button>
        </div>
      </div>

      {/* KPI Cards — profesional, bisa klik untuk filter */}
      <div className="ikpi-grid">

        {/* Total */}
        <button
          className={`ikpi-card ${filters.status === "" ? "ikpi-card--active" : ""}`}
          onClick={() => { setFilters({ ...filters, status: "" }); fetchDashboard({ ...filters, status: "" }); }}
        >
          <div className="ikpi-top">
            <div className="ikpi-icon" style={{ background: "#e8e9f9" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" fill="#060771"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#060771" opacity=".35"/></svg>
            </div>
            <span className="ikpi-pct" style={{ color: "#060771" }}>Semua</span>
          </div>
          <p className="ikpi-value">{totalIntern}</p>
          <p className="ikpi-label">Total Intern</p>
          <div className="ikpi-bar" style={{ background: "#060771" }} />
        </button>

        {/* Onboard */}
        <button
          className={`ikpi-card ${filters.status === "onboard" ? "ikpi-card--active" : ""}`}
          onClick={() => { setFilters({ ...filters, status: "onboard" }); fetchDashboard({ ...filters, status: "onboard" }); }}
        >
          <div className="ikpi-top">
            <div className="ikpi-icon" style={{ background: "#dcfce7" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className="ikpi-pct" style={{ color: "#16a34a" }}>{toPercent(data.kpi.onboard)}%</span>
          </div>
          <p className="ikpi-value">{data.kpi.onboard || 0}</p>
          <p className="ikpi-label">On Board</p>
          <div className="ikpi-bar" style={{ background: "#16a34a" }} />
        </button>

        {/* Butuh Surat Balasan */}
        <button
          className={`ikpi-card ${filters.status === "butuh surat balasan" ? "ikpi-card--active" : ""}`}
          onClick={() => { setFilters({ ...filters, status: "butuh surat balasan" }); fetchDashboard({ ...filters, status: "butuh surat balasan" }); }}
        >
          <div className="ikpi-top">
            <div className="ikpi-icon" style={{ background: "#fef3c7" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#b45309" strokeWidth="1.8" fill="none"/><path d="M3 9l9 6 9-6" stroke="#b45309" strokeWidth="1.8"/></svg>
            </div>
            <span className="ikpi-pct" style={{ color: "#b45309" }}>{toPercent(data.kpi.butuh_surat_balasan)}%</span>
          </div>
          <p className="ikpi-value">{data.kpi.butuh_surat_balasan || 0}</p>
          <p className="ikpi-label">Butuh Balasan</p>
          <div className="ikpi-bar" style={{ background: "#b45309" }} />
        </button>

        {/* Ajukan Ulang */}
        <button
          className={`ikpi-card ${filters.status === "ajukan ulang" ? "ikpi-card--active" : ""}`}
          onClick={() => { setFilters({ ...filters, status: "ajukan ulang" }); fetchDashboard({ ...filters, status: "ajukan ulang" }); }}
        >
          <div className="ikpi-top">
            <div className="ikpi-icon" style={{ background: "#fff3e0" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4v5h5M20 20v-5h-5" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round"/><path d="M20 9A8 8 0 005.3 7.3M4 15a8 8 0 0014.7 1.7" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <span className="ikpi-pct" style={{ color: "#ea580c" }}>{toPercent(data.kpi.ajukan_ulang)}%</span>
          </div>
          <p className="ikpi-value">{data.kpi.ajukan_ulang || 0}</p>
          <p className="ikpi-label">Ajukan Ulang</p>
          <div className="ikpi-bar" style={{ background: "#ea580c" }} />
        </button>

        {/* Selesai */}
        <button
          className={`ikpi-card ${filters.status === "selesai" ? "ikpi-card--active" : ""}`}
          onClick={() => { setFilters({ ...filters, status: "selesai" }); fetchDashboard({ ...filters, status: "selesai" }); }}
        >
          <div className="ikpi-top">
            <div className="ikpi-icon" style={{ background: "#f9e8e8" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" fill="#BF1A1A" opacity=".8"/><path d="M8 6V5a4 4 0 018 0v1" fill="#BF1A1A"/></svg>
            </div>
            <span className="ikpi-pct" style={{ color: "#BF1A1A" }}>{toPercent(data.kpi.selesai)}%</span>
          </div>
          <p className="ikpi-value">{data.kpi.selesai || 0}</p>
          <p className="ikpi-label">Selesai</p>
          <div className="ikpi-bar" style={{ background: "#BF1A1A" }} />
        </button>

      </div>

      {/* =========================
          ROW 1: Area Chart Permohonan (Full Width)
      ========================= */}
      <div className="chart-card chart-card--row1">
        <p className="chart-title">Tren Permohonan Internship</p>
        <p className="chart-desc">Jumlah permohonan masuk per bulan</p>
        {data.permohonan.length === 0 ? (
          <p className="no-data">No Data Available</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.permohonan} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
              <defs>
                <linearGradient id="gradPermohonan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BF1A1A" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#BF1A1A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false} />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: "#000000" }} angle={-35} textAnchor="end" height={60} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#565656" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e0e0e0" }} />
              <Area 
                type="monotone" 
                dataKey="jumlah" 
                name="Permohonan" 
                stroke="#BF1A1A" 
                strokeWidth={2} 
                fill="url(#gradPermohonan)" 
                dot={{ r: 3, fill: "#BF1A1A", strokeWidth: 0 }} 
                activeDot={{ r: 5, fill: "#BF1A1A" }} 
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* =========================
          ROW 2: Institusi & Ket (2 Columns)
      ========================= */}
      <div className="internship-row-2">
        {/* LEFT: Bar Chart Institusi */}
        <div className="chart-card">
          <p className="chart-title">Distribusi Institusi</p>
          <p className="chart-desc">Jumlah peserta dari tiap institusi asal</p>
          {data.institusi.length === 0 ? (
            <p className="no-data">No Data Available</p>
          ) : (
            <div className="institusi-layout">
              <div className="institusi-chart">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.institusi} barCategoryGap="40%" margin={{ top: 4, right: 8, left: 0, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false} />
                    <XAxis dataKey="institusi" tick={{ fontSize: 10, fill: "#000000" }} angle={-35} textAnchor="end" height={64} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#565656" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e0e0e0" }} />
                    <Bar dataKey="jumlah" name="Jumlah" fill="#060771" barSize={25} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="institusi-list">
                <p className="institusi-list-title">Ranking</p>
                {topInstitusi.map((item, idx) => (
                  <div key={`${item.institusi}-${idx}`} className="institusi-item">
                    <span className="institusi-name">{idx + 1}. {item.institusi}</span>
                    <span className="institusi-count">{item.jumlah || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Pie Chart Kategori (Ket) */}
        <div className="chart-card chart-card--ket">
          <p className="chart-title">Tingkat Pendidikan</p>
          <p className="chart-desc">Komposisi peserta berdasarkan jenjang pendidikan</p>
          {data.ket.length === 0 ? (
            <p className="no-data">No Data Available</p>
          ) : (
            <div className="ket-chart">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.ket}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={3}
                    cornerRadius={4}
                    dataKey="jumlah"
                  >
                    {data.ket.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e0e0e0" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="ket-legend">
                {data.ket.map((entry, index) => (
                  <div key={`legend-${index}`} className="ket-legend-item">
                    <span className="ket-legend-left">
                      <span className="ket-legend-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="ket-legend-label">{entry.ket}</span>
                    </span>
                    <span className="ket-legend-value">{entry.jumlah}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================
          ROW 3: Full Width Penempatan Chart
      ========================= */}
      <div className="chart-card chart-card--row3">
        <p className="chart-title">Distribusi Penempatan</p>
        <p className="chart-desc">Jumlah peserta magang per divisi penempatan</p>
        {data.penempatan.length === 0 ? (
          <p className="no-data">No Data Available</p>
        ) : (
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={data.penempatan} barCategoryGap="40%" margin={{ top: 4, right: 16, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f6" vertical={false} />
              <XAxis dataKey="penempatan" tick={{ fontSize: 11, fill: "#292929" }} angle={0} textAnchor="center" height={40} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#323232" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "0.5px solid #e0e0e0" }} />
              <Bar dataKey="jumlah" name="Jumlah" fill="#BF1A1A" barSize={40} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        )}  
      </div>
    </div>
  );
}
