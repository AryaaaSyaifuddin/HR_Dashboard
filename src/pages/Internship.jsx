import './Placeholder.css'
import { useEffect, useState } from "react";
import axios from "axios";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

const API_URL = "http://127.0.0.1:5000/dashboard";
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

  return (
    <div className="internship-wrapper">
      <p className="section-label">Dashboard Internship — Analisis Data</p>

      {/* =========================
          FILTER SECTION
      ========================= */}
      <div className="internship-filter">
        <div className="filter-header">
          <p className="filter-title">Filter</p>
          <button className="filter-reset-btn" onClick={resetFilters}>
            ↺ Reset
          </button>
        </div>

        <div className="filter-controls">
          {/* Filter Institusi */}
          <div className="filter-group">
            <label className="filter-label">Institusi</label>
            <select
              className="filter-input"
              value={filters.institusi}
              onChange={(e) => handleFilterChange("institusi", e.target.value)}
            >
              <option value="">-- Semua Institusi --</option>
              {filterOptions.institusi.map((inst, idx) => (
                <option key={idx} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          {/* Filter Penempatan */}
          <div className="filter-group">
            <label className="filter-label">Penempatan</label>
            <select
              className="filter-input"
              value={filters.penempatan}
              onChange={(e) => handleFilterChange("penempatan", e.target.value)}
            >
              <option value="">-- Semua Divisi --</option>
              {filterOptions.penempatan.map((penem, idx) => (
                <option key={idx} value={penem}>{penem}</option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="filter-input"
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">-- Semua Status --</option>
              {filterOptions.status.map((stat, idx) => (
                <option key={idx} value={stat}>
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tanggal Range */}
          <div className="filter-group filter-group--date">
            <label className="filter-label">Periode Tanggal</label>
            <input
              type="text"
              className="filter-input"
              value={dateRange[0] && dateRange[1] 
                ? `${dateRange[0].toLocaleDateString('id-ID')} - ${dateRange[1].toLocaleDateString('id-ID')}`
                : dateRange[0]
                ? dateRange[0].toLocaleDateString('id-ID')
                : "Pilih tanggal"
              }
              readOnly
              onClick={() => setShowDatePicker(!showDatePicker)}
              style={{ cursor: 'pointer' }}
            />
            {showDatePicker && (
              <div className="date-picker-wrapper">
                <Calendar
                  selectRange={true}
                  value={dateRange}
                  onChange={(value) => {
                    setDateRange(value);
                    if (value[0] && value[1]) {
                      setTimeout(() => setShowDatePicker(false), 200);
                      const startDate = value[0].toISOString().split('T')[0];
                      const endDate = value[1].toISOString().split('T')[0];
                      setFilters(prev => ({...prev, start: startDate, end: endDate}));
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Apply Button */}
          <div className="filter-group filter-group--action">
            <button className="filter-apply-btn" onClick={applyFilters}>
              🔍 Terapkan Filter
            </button>
          </div>
        </div>

        {/* Quick Filter Buttons (KPI) */}
        <div className="quick-filters">
          <p className="quick-filter-label">Quick Filter by Status</p>
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${filters.status === "" ? "filter-btn--active" : ""}`}
              onClick={() => { setFilters({ ...filters, status: "" }); fetchDashboard({ ...filters, status: "" }); }}
            >
              <span className="filter-label">Total Intern</span>
              <span className="filter-value">{data.kpi.total || 0}</span>
            </button>
            <button 
              className={`filter-btn ${filters.status === "onboard" ? "filter-btn--active" : ""}`}
              onClick={() => { setFilters({ ...filters, status: "onboard" }); fetchDashboard({ ...filters, status: "onboard" }); }}
            >
              <span className="filter-label">On Board</span>
              <span className="filter-value">{data.kpi.onboard || 0}</span>
            </button>
            <button 
              className={`filter-btn ${filters.status === "butuh surat balasan" ? "filter-btn--active" : ""}`}
              onClick={() => { setFilters({ ...filters, status: "butuh surat balasan" }); fetchDashboard({ ...filters, status: "butuh surat balasan" }); }}
            >
              <span className="filter-label">Butuh surat balasan</span>
              <span className="filter-value">{data.kpi.butuh_surat_balasan || 0}</span>
            </button>
            <button 
              className={`filter-btn ${filters.status === "ajukan ulang" ? "filter-btn--active" : ""}`}
              onClick={() => { setFilters({ ...filters, status: "ajukan ulang" }); fetchDashboard({ ...filters, status: "ajukan ulang" }); }}
            >
              <span className="filter-label">Ajukan ulang</span>
              <span className="filter-value">{data.kpi.ajukan_ulang || 0}</span>
            </button>
            <button 
              className={`filter-btn ${filters.status === "selesai" ? "filter-btn--active" : ""}`}
              onClick={() => { setFilters({ ...filters, status: "selesai" }); fetchDashboard({ ...filters, status: "selesai" }); }}
            >
              <span className="filter-label">Selesai</span>
              <span className="filter-value">{data.kpi.selesai || 0}</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================
          ROW 1: Line Chart Permohonan (Full Width)
      ========================= */}
      <div className="chart-card chart-card--row1">
        <p className="chart-title">Permohonan tiap bulan</p>
        <p className="chart-desc">Tren permohonan internship dari waktu ke waktu</p>
        {data.permohonan.length === 0 ? (
          <p className="no-data">No Data Available</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={data.permohonan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="bulan" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="jumlah" name="Jumlah" stroke="#060771" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* =========================
          ROW 2: Institusi & Ket (2 Columns)
      ========================= */}
      <div className="internship-row-2">
        {/* LEFT: Bar Chart Institusi */}
        <div className="chart-card">
          <p className="chart-title">Institusi</p>
          <p className="chart-desc">Distribusi peserta dari berbagai institusi</p>
          {data.institusi.length === 0 ? (
            <p className="no-data">No Data Available</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.institusi} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="institusi" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="jumlah" name="Jumlah" fill="#060771" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* RIGHT: Pie Chart Kategori (Ket) */}
        <div className="chart-card">
          <p className="chart-title">Ket</p>
          <p className="chart-desc">Komposisi peserta berdasarkan tingkat pendidikan</p>
          {data.ket.length === 0 ? (
            <p className="no-data">No Data Available</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={data.ket}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.ket}: ${entry.jumlah}`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="jumlah"
                >
                  {data.ket.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* =========================
          ROW 3: Full Width Penempatan Chart
      ========================= */}
      <div className="chart-card chart-card--row3">
        <p className="chart-title">Penempatan</p>
        <p className="chart-desc">Distribusi penempatan peserta ke berbagai divisi</p>
        {data.penempatan.length === 0 ? (
          <p className="no-data">No Data Available</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.penempatan} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="penempatan" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="jumlah" name="Jumlah" fill="#BF1A1A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
