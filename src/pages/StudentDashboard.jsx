import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const navigate = useNavigate();

  // Mock bus locations for real-time simulation
  const busLocations = {
    '66d0123456a1b2c3d4e5f601': [
      { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, Delhi', time: '08:00 AM' },
      { lat: 28.6289, lng: 77.2065, address: 'Rajiv Chowk, Delhi', time: '08:15 AM' },
      { lat: 28.6328, lng: 77.2197, address: 'Barakhamba Road, Delhi', time: '08:30 AM' },
      { lat: 28.6562, lng: 77.2410, address: 'Near College Gate', time: '08:45 AM' }
    ],
    '66d0123456a1b2c3d4e5f602': [
      { lat: 28.5562, lng: 77.1000, address: 'IGI Airport, Delhi', time: '08:00 AM' },
      { lat: 28.5755, lng: 77.1200, address: 'Aerocity, Delhi', time: '08:20 AM' },
      { lat: 28.6000, lng: 77.1500, address: 'Mahipalpur, Delhi', time: '08:40 AM' },
      { lat: 28.6562, lng: 77.2410, address: 'Near College Gate', time: '09:00 AM' }
    ]
  };

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem('studentData') || '{}');
    setStudentData(student);

    // Simulate real-time location updates
    const updateLocation = () => {
      const locations = busLocations[student.bus?.$oid] || [];
      const randomLocation = locations[Math.floor(Math.random() * locations.length)];
      setBusLocation(randomLocation);
      setLastUpdated(new Date());
    };

    updateLocation();
    const interval = setInterval(updateLocation, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('studentData');
    navigate('/');
  };

  if (!studentData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
        }}
      ></div>
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-800/70 to-purple-900/80"></div>
      
      {/* Animated location markers */}
      <div className="fixed inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-blue-400 rounded-full opacity-30 animate-pulse-custom"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <div className="relative bg-white/95 backdrop-blur-lg shadow-2xl border-b-4 border-blue-500">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold gradient-text-blue flex items-center">
                🎓 <span className="ml-3">Student Dashboard</span>
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Welcome, {studentData.name}</p>
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

      <div className="relative p-6 space-y-8">
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 card-hover">
          <h2 className="text-2xl font-bold mb-6 gradient-text-blue flex items-center">
            📍 <span className="ml-3">Your Bus Location</span>
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-blue-800 flex items-center">
                🗺️ <span className="ml-2">Live Location</span>
              </h3>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-semibold">Live</span>
              </div>
            </div>
            {busLocation ? (
              <div className="space-y-3">
                <p className="text-blue-700 text-xl font-semibold">{busLocation.address}</p>
                <p className="text-blue-600">Estimated arrival: {busLocation.time}</p>
                <p className="text-sm text-gray-600">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="spinner"></div>
                <p className="text-gray-600">Loading location...</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 card-hover">
          <h2 className="text-2xl font-bold mb-6 gradient-text-blue flex items-center">
            👤 <span className="ml-3">Your Details</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <p className="text-blue-800 font-semibold">Name</p>
                <p className="text-blue-600 text-lg">{studentData.name}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <p className="text-green-800 font-semibold">Roll No</p>
                <p className="text-green-600 text-lg">{studentData.rollNo}</p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <p className="text-purple-800 font-semibold">Email</p>
                <p className="text-purple-600 text-sm">{studentData.email}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                <p className="text-indigo-800 font-semibold">Bus ID</p>
                <p className="text-indigo-600 text-lg">{studentData.bus?.$oid}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <p className="text-orange-800 font-semibold">Route</p>
                <p className="text-orange-600 text-sm">{
                  studentData.bus?.$oid === '66d0123456a1b2c3d4e5f601' 
                    ? 'Route A - City Center to College'
                    : 'Route B - Airport to College'
                }</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 card-hover">
          <h2 className="text-2xl font-bold mb-6 gradient-text-blue flex items-center">
            🚌 <span className="ml-3">Bus Status</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-center p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-6 h-6 bg-green-500 rounded-full mr-4 animate-pulse"></div>
              <span className="text-green-800 font-semibold text-lg">Bus is Active</span>
            </div>
            <div className="flex items-center justify-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-6 h-6 bg-blue-500 rounded-full mr-4 animate-pulse"></div>
              <span className="text-blue-800 font-semibold text-lg">Real-time Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
