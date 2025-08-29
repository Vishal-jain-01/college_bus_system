import { useState } from 'react'
import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoleSelection from "./pages/RoleSelection.jsx";
import StudentLogin from "./pages/StudentLogin.jsx";
import DriverLogin from "./pages/DriverLogin.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import StudentsList from "./pages/StudentsList";
import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import DriverDashboard from "./pages/DriverDashboard.jsx";
import AttendanceRecords from "./pages/AttendanceRecords.jsx";
import LiveMap from "./pages/LiveMap.jsx";

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/login/student" element={<StudentLogin />} />
        <Route path="/login/driver" element={<DriverLogin />} />
        <Route path="/login/admin" element={<AdminLogin />} />
        <Route path="/students" element={<StudentsList />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/attendance/records" element={<AttendanceRecords />} />
        <Route path="/live-map" element={<LiveMap />} />
      </Routes>
    </Router>
  )
}

export default App;
