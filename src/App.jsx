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
  { id: 'overtime',    label: 'Attendance & Overtime',    page: <Overtime /> },
  { id: 'bpjs',        label: 'BPJS',                   page: <BPJS /> },
  { id: 'salary',      label: 'Salary & PPH21',         page: <Salary /> },
  { id: 'kpi',         label: 'KPI',                    page: <KPI /> },
  { id: 'training',    label: 'Ext / Int Training',     page: <Training /> },
]

export default function App() {

  const [activePage, setActivePage] = useState('home')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const currentMenu = MENU.find(m => m.id === activePage)

  return (
    <div className="app-layout">

      <Sidebar
        menu={MENU}
        activePage={activePage}
        onNavigate={setActivePage}
        isOpen={sidebarOpen}
      />

      <div className="main-area">

        <Topbar title={currentMenu.label} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className="page-content">
          {currentMenu.page}
        </div>
      </div>
    </div>
  )
}
