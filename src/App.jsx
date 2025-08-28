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
        <Route path="/student/dashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  )
}

export default App;
