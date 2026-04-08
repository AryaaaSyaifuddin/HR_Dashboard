import './Placeholder.css'
import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid, ResponsiveContainer
} from "recharts";

const API_BASE_URL = "/api";

export default function Internship() {
  const [institusi, setInstitusi] = useState([]);
  const [permohonan, setPermohonan] = useState([]);
  const [status, setStatus] = useState([]);
  
  const [loadingInstitusi, setLoadingInstitusi] = useState(true);
  const [loadingPermohonan, setLoadingPermohonan] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(true);
  
  const [errorInstitusi, setErrorInstitusi] = useState(null);
  const [errorPermohonan, setErrorPermohonan] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  // =========================
  // FETCH DATA DARI PYTHON API
  // =========================
  useEffect(() => {
    // Fetch Institusi
    axios
      .get(`${API_BASE_URL}/institusi`)
      .then(res => {
        console.log("✅ Data institusi berhasil diambil:", res.data);
        setInstitusi(res.data);
        setErrorInstitusi(null);
      })
      .catch(err => {
        console.error("❌ Error fetch institusi:", err.message);
        setErrorInstitusi(err.message);
        setInstitusi([]);
      })
      .finally(() => setLoadingInstitusi(false));

    // Fetch Permohonan
    axios
      .get(`${API_BASE_URL}/permohonan`)
      .then(res => {
        console.log("✅ Data permohonan berhasil diambil:", res.data);
        setPermohonan(res.data);
        setErrorPermohonan(null);
      })
      .catch(err => {
        console.error("❌ Error fetch permohonan:", err.message);
        setErrorPermohonan(err.message);
        setPermohonan([]);
      })
      .finally(() => setLoadingPermohonan(false));

    // Fetch Status
    axios
      .get(`${API_BASE_URL}/status`)
      .then(res => {
        console.log("✅ Data status berhasil diambil:", res.data);
        setStatus(res.data);
        setErrorStatus(null);
      })
      .catch(err => {
        console.error("❌ Error fetch status:", err.message);
        setErrorStatus(err.message);
        setStatus([]);
      })
      .finally(() => setLoadingStatus(false));
  }, []);

  // Hitung total peserta dengan .reduce()
  const totalPeserta = institusi.reduce((accumulator, item) => {
    return accumulator + (item.jumlah || 0);
  }, 0);

  console.log("📊 Total peserta:", totalPeserta);

  return (
    <div style={{ padding: "20px" }}>
      <h2>📊 Dashboard Internship</h2>

      {/* =========================
          SUMMARY CARD
      ========================= */}
      <div style={{ display: "flex", gap: "20px", marginTop: "20px", flexWrap: "wrap" }}>
        <div className="card">
          <h4>Total Institusi</h4>
          <p>{institusi.length}</p>
        </div>

        <div className="card">
          <h4>Total Peserta</h4>
          <p>{totalPeserta}</p>
        </div>

        <div className="card">
          <h4>Total Status</h4>
          <p>{status.length}</p>
        </div>
      </div>

      {/* =========================
          CHART 1 - BAR (INSTITUSI)
      ========================= */}
      <h3 style={{ marginTop: "40px" }}>📈 Peserta per Institusi</h3>
      
      {loadingInstitusi ? (
        <p style={{ color: "#666" }}>⏳ Loading data institusi...</p>
      ) : errorInstitusi ? (
        <p style={{ color: "#d32f2f" }}>❌ Error: {errorInstitusi}</p>
      ) : institusi.length === 0 ? (
        <p style={{ color: "#666" }}>📭 Tidak ada data institusi</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={institusi}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="institusi" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="jumlah" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* =========================
          CHART 2 - LINE (PERMOHONAN)
      ========================= */}
      <h3 style={{ marginTop: "40px" }}>📉 Permohonan per Bulan</h3>
      
      {loadingPermohonan ? (
        <p style={{ color: "#666" }}>⏳ Loading data permohonan...</p>
      ) : errorPermohonan ? (
        <p style={{ color: "#d32f2f" }}>❌ Error: {errorPermohonan}</p>
      ) : permohonan.length === 0 ? (
        <p style={{ color: "#666" }}>📭 Tidak ada data permohonan</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={permohonan}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="bulan" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="jumlah" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* =========================
          STATUS DATA
      ========================= */}
      <h3 style={{ marginTop: "40px" }}>📋 Data Status</h3>
      
      {loadingStatus ? (
        <p style={{ color: "#666" }}>⏳ Loading data status...</p>
      ) : errorStatus ? (
        <p style={{ color: "#d32f2f" }}>❌ Error: {errorStatus}</p>
      ) : status.length === 0 ? (
        <p style={{ color: "#666" }}>📭 Tidak ada data status</p>
      ) : (
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {status.map((item, index) => (
            <div className="card" key={index}>
              <h5>{item.status || "Status"}</h5>
              <p style={{ fontSize: "24px", fontWeight: "bold" }}>{item.jumlah || 0}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}