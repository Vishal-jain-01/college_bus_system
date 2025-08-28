import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DriverDashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [driverData, setDriverData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const driver = JSON.parse(localStorage.getItem('driverData') || '{}');
    setDriverData(driver);

    fetch('/student.json')
      .then(response => response.json())
      .then(data => {
        const busStudents = data.filter(student => student.bus.$oid === driver.busId);
        setStudents(busStudents);
        
        // Initialize attendance
        const initialAttendance = {};
        busStudents.forEach(student => {
          initialAttendance[student.rollNo] = false;
        });
        setAttendance(initialAttendance);
      })
      .catch(err => console.error('Error loading student data:', err));
  }, []);

  const toggleAttendance = (rollNo) => {
    setAttendance(prev => ({
      ...prev,
      [rollNo]: !prev[rollNo]
    }));
  };

  const submitAttendance = () => {
    const presentStudents = Object.entries(attendance)
      .filter(([_, isPresent]) => isPresent)
      .map(([rollNo, _]) => rollNo);
    
    alert(`Attendance submitted for ${presentStudents.length} students: ${presentStudents.join(', ')}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('driverData');
    navigate('/');
  };

  if (!driverData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1464822759844-d150cb8c2bdc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
        }}
      ></div>
      <div className="fixed inset-0 bg-gradient-to-br from-green-900/80 via-emerald-800/70 to-teal-900/80"></div>
      
      {/* Header */}
      <div className="relative bg-white/95 backdrop-blur-lg shadow-2xl border-b-4 border-green-500">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold gradient-text-green flex items-center">
                🚗 <span className="ml-3">Driver Dashboard</span>
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Welcome, {driverData.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl hover:from-red-600 hover:to-red-700 transform hover:scale-110 transition-all duration-300 shadow-xl flex items-center space-x-2 btn-hover"
            >
              <span>🚪</span>
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative p-6">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white/20 card-hover">
          <h2 className="text-2xl font-bold mb-6 gradient-text-green flex items-center">
            📋 <span className="ml-3">Take Attendance</span>
          </h2>
          <p className="text-gray-600 mb-6 text-lg">Mark students as present for today's journey</p>
          
          <div className="space-y-3">
            {students.map(student => (
              <div key={student.rollNo} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-600">{student.rollNo}</p>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={attendance[student.rollNo] || false}
                    onChange={() => toggleAttendance(student.rollNo)}
                    className="mr-2 w-5 h-5"
                  />
                  <span className={attendance[student.rollNo] ? 'text-green-600' : 'text-gray-400'}>
                    {attendance[student.rollNo] ? 'Present' : 'Absent'}
                  </span>
                </label>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={submitAttendance}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600"
            >
              Submit Attendance
            </button>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 card-hover">
          <h3 className="text-2xl font-bold mb-4 gradient-text-green flex items-center">
            🚌 <span className="ml-3">Bus Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <p className="text-blue-800 font-semibold">Bus ID</p>
              <p className="text-blue-600">{driverData.busId}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <p className="text-green-800 font-semibold">Total Students</p>
              <p className="text-green-600">{students.length}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <p className="text-purple-800 font-semibold">Present Today</p>
              <p className="text-purple-600">{Object.values(attendance).filter(Boolean).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
