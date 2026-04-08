import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'

// Import semua halaman
import Home from './pages/Home.jsx'
import Recruitment from './pages/Recruitment.jsx'
import ManPower from './pages/ManPower.jsx'
import Internship from './pages/Internship.jsx'
import Overtime from './pages/Overtime.jsx'
import BPJS from './pages/BPJS.jsx'
import Salary from './pages/Salary.jsx'
import KPI from './pages/KPI.jsx'
import Training from './pages/Training.jsx'

import './App.css'

/*
  DAFTAR MENU
  Setiap item punya:
  - id     : identitas unik menu
  - label  : teks yang tampil di sidebar
  - page   : komponen halaman yang akan ditampilkan
*/
const MENU = [
  { id: 'home',        label: 'Home',                   page: <Home /> },
  { id: 'recruitment', label: 'Employee Recruitment',   page: <Recruitment /> },
  { id: 'manpower',    label: 'Data Man Power',         page: <ManPower /> },
  { id: 'internship',  label: 'Internship',             page: <Internship /> },
  { id: 'overtime',    label: 'Overtime',               page: <Overtime /> },
  { id: 'bpjs',        label: 'BPJS',                   page: <BPJS /> },
  { id: 'salary',      label: 'Salary & PPH21',         page: <Salary /> },
  { id: 'kpi',         label: 'KPI',                    page: <KPI /> },
  { id: 'training',    label: 'Ext / Int Training',     page: <Training /> },
]

export default function App() {
  /*
    useState: menyimpan "halaman aktif sekarang".
    Nilai awal = 'home' (tampilkan Home saat pertama buka).
    
    activePage  = nilai saat ini
    setActivePage = fungsi untuk mengubah nilai
  */
  const [activePage, setActivePage] = useState('home')

  // Cari menu yang sedang aktif berdasarkan id-nya
  const currentMenu = MENU.find(m => m.id === activePage)

  return (
    <div className="app-layout">
      {/*
        Sidebar menerima:
        - menu      : daftar semua menu
        - activePage: halaman yang sedang aktif
        - onNavigate: fungsi yang dipanggil saat user klik menu
      */}
      <Sidebar
        menu={MENU}
        activePage={activePage}
        onNavigate={setActivePage}
      />

      <div className="main-area">
        {/*
          Topbar menerima title halaman yang sedang aktif
        */}
        <Topbar title={currentMenu.label} />

        {/* Tampilkan konten halaman yang aktif */}
        <div className="page-content">
          {currentMenu.page}
        </div>
      </div>
    </div>
  )
}
