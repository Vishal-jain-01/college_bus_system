import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttendanceDB } from '../utils/attendanceDB.js';
import { LocationService } from '../utils/locationService.js';

export default function DriverDashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [driverData, setDriverData] = useState(null);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [watchId, setWatchId] = useState(null);

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

  const submitAttendance = async () => {
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const presentStudents = Object.entries(attendance)
        .filter(([_, isPresent]) => isPresent)
        .map(([rollNo, _]) => {
          const student = students.find(s => s.rollNo === rollNo);
          return {
            rollNo: rollNo,
            name: student?.name || '',
            email: student?.email || ''
          };
        });

      const absentStudents = Object.entries(attendance)
        .filter(([_, isPresent]) => !isPresent)
        .map(([rollNo, _]) => {
          const student = students.find(s => s.rollNo === rollNo);
          return {
            rollNo: rollNo,
            name: student?.name || '',
            email: student?.email || ''
          };
        });

      const attendanceData = {
        driverId: driverData.id,
        driverName: driverData.name,
        busId: driverData.busId,
        presentStudents: presentStudents,
        absentStudents: absentStudents,
        totalStudents: students.length,
        route: driverData.busId === '66d0123456a1b2c3d4e5f601' ? 'Route A - City Center to College' : 'Route B - Airport to College',
        notes: `Attendance taken by ${driverData.name}`
      };

      const result = await AttendanceDB.saveAttendance(attendanceData);
      
      if (result.success) {
        setSubmitMessage(`✅ Attendance submitted successfully! Record ID: ${result.recordId}`);
        // Reset attendance after successful submission
        const resetAttendance = {};
        students.forEach(student => {
          resetAttendance[student.rollNo] = false;
        });
        setAttendance(resetAttendance);
      } else {
        setSubmitMessage(`❌ Error submitting attendance: ${result.error}`);
      }
    } catch (error) {
      setSubmitMessage(`❌ Error submitting attendance: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      setLocationError(null);
      
      // Get initial location
      const initialLocation = await LocationService.getCurrentRealLocation();
      setCurrentLocation(initialLocation);
      
      // Start continuous tracking
      const id = LocationService.startRealTimeTracking(
        driverData.id,
        driverData.busId,
        (locationData) => {
          setCurrentLocation(locationData);
          console.log('New location:', locationData);
        }
      );
      
      setWatchId(id);
      setIsTracking(true);
      
    } catch (error) {
      setLocationError(error.message);
      console.error('Location tracking error:', error);
    }
  };

  const stopLocationTracking = () => {
    if (watchId) {
      LocationService.stopRealTimeTracking(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (watchId) {
        LocationService.stopRealTimeTracking(watchId);
      }
    };
  }, [watchId]);

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
        {/* GPS Tracking Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white/20 card-hover">
          <h2 className="text-2xl font-bold mb-6 gradient-text-green flex items-center">
            📍 <span className="ml-3">GPS Location Tracking</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={isTracking ? stopLocationTracking : startLocationTracking}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isTracking 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {isTracking ? '⏹️ Stop Tracking' : '▶️ Start Tracking'}
                </button>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className={isTracking ? 'text-green-600' : 'text-gray-500'}>
                    {isTracking ? 'Live Tracking' : 'Tracking Stopped'}
                  </span>
                </div>
              </div>

              {locationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  <p>❌ {locationError}</p>
                  <p className="text-sm mt-1">Please enable location permissions in your browser</p>
                </div>
              )}
            </div>

            <div>
              {currentLocation && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">Current Location</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Latitude:</strong> {currentLocation.lat.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {currentLocation.lng.toFixed(6)}</p>
                    <p><strong>Speed:</strong> {currentLocation.speed ? `${(currentLocation.speed * 3.6).toFixed(1)} km/h` : 'N/A'}</p>
                    <p><strong>Accuracy:</strong> {currentLocation.accuracy ? `${currentLocation.accuracy.toFixed(0)}m` : 'N/A'}</p>
                    <p><strong>Last Update:</strong> {new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white/20 card-hover">
          <h2 className="text-2xl font-bold mb-6 gradient-text-green flex items-center">
            📋 <span className="ml-3">Take Attendance</span>
          </h2>
          <p className="text-gray-600 mb-6 text-lg">Mark students as present for today's journey</p>
          
          <div className="space-y-3">
            {students.map(student => (
              <div key={student.rollNo} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200">
                <div>
                  <p className="font-medium text-lg">{student.name}</p>
                  <p className="text-sm text-gray-600">{student.rollNo}</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attendance[student.rollNo] || false}
                    onChange={() => toggleAttendance(student.rollNo)}
                    className="mr-3 w-6 h-6 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className={`font-semibold text-lg ${attendance[student.rollNo] ? 'text-green-600' : 'text-gray-400'}`}>
                    {attendance[student.rollNo] ? '✅ Present' : '❌ Absent'}
                  </span>
                </label>
              </div>
            ))}
          </div>

          {submitMessage && (
            <div className={`mt-6 p-4 rounded-xl ${
              submitMessage.includes('✅') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {submitMessage}
            </div>
          )}

          <div className="mt-8">
            <button
              onClick={submitAttendance}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 transform hover:scale-105 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  Submitting Attendance...
                </div>
              ) : (
                '📤 Submit Attendance to Database'
              )}
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
