import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleMaps } from '../hooks/useGoogleMaps.js';
import { LocationService } from '../utils/locationService.js';
import GoogleMap from '../components/GoogleMap.jsx';

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [realTimeLocations, setRealTimeLocations] = useState([]);
  const [activeTab, setActiveTab] = useState('location');
  const [studentBusLocation, setStudentBusLocation] = useState(null);
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps('AIzaSyDRrEGi2nzH-3W2qqhOCFzZuRms5tGeYvI');

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem('studentData') || '{}');
    setStudentData(student);

    // Load only the student's bus real-time GPS location every 5 seconds
    const loadStudentBusLocation = () => {
      if (student.bus?.$oid) {
        // Get real GPS location from driver
        const location = LocationService.getRealLocation(student.bus.$oid);
        
        if (location) {
          // Enhanced real GPS location with bus info
          const busInfo = LocationService.busInfo[student.bus.$oid];
          const enhancedLocation = {
            ...location,
            busId: student.bus.$oid,
            busNumber: busInfo?.busNumber || 'Unknown',
            route: busInfo?.route || 'Unknown Route',
            driverName: busInfo?.driver || 'Unknown Driver',
            lastUpdated: new Date(location.lastUpdated).toLocaleTimeString()
          };
          
          setStudentBusLocation(enhancedLocation);
          console.log('Real GPS location loaded for student:', enhancedLocation);
        } else {
          console.log('No real GPS location available for bus:', student.bus.$oid);
          setStudentBusLocation(null);
        }
      }
    };

    // Initial load
    loadStudentBusLocation();
    
    // Update every 5 seconds for real-time tracking
    const locationInterval = setInterval(loadStudentBusLocation, 5000);

    return () => {
      clearInterval(locationInterval);
    };
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
        {/* Tab Navigation */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-3 border border-white/20">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('location')}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 ${
                activeTab === 'location' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl transform scale-105' 
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <span>📍</span>
              <span>My Bus Location</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 ${
                activeTab === 'profile' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl transform scale-105' 
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              <span>👤</span>
              <span>Profile</span>
            </button>
          </div>
        </div>

        {/* My Bus Location Tab */}
        {activeTab === 'location' && (
          <div className="animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              <div className="p-8 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                  📍 <span className="ml-3">Your Bus Live Location</span>
                </h2>
                <p className="text-blue-100 text-lg">Real-time GPS tracking of your assigned bus</p>
              </div>
              
              <div className="p-6">
                {studentBusLocation ? (
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-800">
                        {studentData.bus?.$oid === '66d0123456a1b2c3d4e5f601' ? 'BUS-001' : 'BUS-002'}
                      </h3>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-green-600 font-semibold">Live GPS</span>
                      </div>
                    </div>

                    {/* Map View */}
                    <div className="mb-6 h-64 rounded-xl overflow-hidden border border-gray-200">
                      <GoogleMap
                        busLocations={[{
                          id: studentBusLocation.busId,
                          lat: studentBusLocation.lat,
                          lng: studentBusLocation.lng,
                          busNumber: studentData.bus?.$oid === '66d0123456a1b2c3d4e5f601' ? 'BUS-001' : 'BUS-002',
                          driver: studentData.bus?.$oid === '66d0123456a1b2c3d4e5f601' ? 'Rajesh Kumar' : 'Suresh Singh',
                          route: studentData.bus?.$oid === '66d0123456a1b2c3d4e5f601' 
                            ? 'Route A - City Center to College'
                            : 'Route B - Airport to College',
                          speed: studentBusLocation.speed,
                          name: `Current Location`,
                          nextStop: 'Next Stop',
                          estimatedArrival: '5:30'
                        }]}
                        center={{ lat: studentBusLocation.lat, lng: studentBusLocation.lng }}
                        zoom={15}
                      />
                    </div>

                    {/* Location Details */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-bold text-blue-800 flex items-center">
                          🗺️ <span className="ml-2">Live Location Details</span>
                        </h4>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-green-600 font-semibold">Live</span>
                        </div>
                      </div>

                      {/* Current Stop Information */}
                      <div className="mb-6 p-4 bg-white rounded-xl border-2 border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-lg font-bold text-green-800 flex items-center">
                            🚏 <span className="ml-2">Current Stop</span>
                          </h5>
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                            Active
                          </span>
                        </div>
                        <p className="text-xl font-bold text-green-700 mb-2">
                          {studentBusLocation.currentStop || 'En Route'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Next Stop:</strong> {studentBusLocation.nextStop || 'Unknown'}
                        </p>
                        {studentBusLocation.estimatedArrival && (
                          <p className="text-sm text-blue-600">
                            <strong>ETA to Next Stop:</strong> {studentBusLocation.estimatedArrival}
                          </p>
                        )}
                      </div>

                      {/* Route Progress - Horizontal Train Style */}
                      <div className="mb-6 p-4 bg-white rounded-xl border border-blue-200">
                        <h5 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                          🛤️ <span className="ml-2">Route Progress</span>
                        </h5>
                        
                        {/* Horizontal Route Display */}
                        <div className="relative">
                          {/* Progress Line */}
                          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 rounded-full"></div>
                          
                          {/* Completed Progress Line */}
                          <div 
                            className="absolute top-6 left-0 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${((studentData.bus?.stops?.findIndex(stop => 
                                stop === (studentBusLocation.currentStop || '').replace('At ', '').replace('Near ', '').split(',')[0]
                              ) || 0) / (studentData.bus?.stops?.length - 1)) * 100}%` 
                            }}
                          ></div>

                          {/* Stops */}
                          <div className="flex justify-between items-center relative">
                            {studentData.bus?.stops?.map((stop, index) => {
                              const currentStopName = (studentBusLocation.currentStop || '').replace('At ', '').replace('Near ', '').split(',')[0];
                              const isCurrentStop = stop === currentStopName;
                              const currentIndex = studentData.bus.stops.findIndex(s => s === currentStopName) || 0;
                              const isPassed = index < currentIndex;
                              const isNext = index === currentIndex + 1;
                              
                              return (
                                <div key={index} className="flex flex-col items-center relative z-10">
                                  {/* Stop Circle */}
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    isCurrentStop 
                                      ? 'bg-green-500 border-green-500 shadow-lg' :
                                    isPassed 
                                      ? 'bg-green-400 border-green-400' :
                                    isNext
                                      ? 'bg-blue-500 border-blue-500 animate-pulse' :
                                      'bg-gray-200 border-gray-300'
                                  }`}>
                                    {isCurrentStop && (
                                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                    )}
                                    {isPassed && (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                    {isNext && (
                                      <div className="w-2 h-2 bg-white rounded-full"></div>
                                    )}
                                  </div>

                                  {/* Stop Name */}
                                  <div className={`mt-2 text-center max-w-24 ${
                                    isCurrentStop 
                                      ? 'text-green-800 font-bold' :
                                    isPassed 
                                      ? 'text-green-600 font-medium' :
                                    isNext
                                      ? 'text-blue-600 font-medium' :
                                      'text-gray-500'
                                  }`}>
                                    <p className="text-xs leading-tight">{stop}</p>
                                    
                                    {/* Status Labels */}
                                    {isCurrentStop && (
                                      <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">
                                        Current
                                      </span>
                                    )}
                                    {isNext && (
                                      <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                        Next
                                      </span>
                                    )}
                                    {isPassed && (
                                      <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                        Passed
                                      </span>
                                    )}
                                  </div>

                                  {/* ETA for Next Stop */}
                                  {isNext && studentBusLocation.estimatedArrival && (
                                    <div className="mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">
                                      ETA: {studentBusLocation.estimatedArrival}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Moving Bus Icon */}
                          <div 
                            className="absolute -top-2 transform -translate-x-1/2 transition-all duration-1000"
                            style={{ 
                              left: `${((studentData.bus?.stops?.findIndex(stop => 
                                stop === (studentBusLocation.currentStop || '').replace('At ', '').replace('Near ', '').split(',')[0]
                              ) || 0) / (studentData.bus?.stops?.length - 1)) * 100}%` 
                            }}
                          >
                            <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg animate-bounce">
                              🚌
                            </div>
                          </div>
                        </div>

                        {/* Route Summary */}
                        <div className="mt-6 flex justify-between items-center text-sm">
                          <div className="text-gray-600">
                            <strong>Route:</strong> {studentBusLocation.route || 'MIET to Muzaffarnagar'}
                          </div>
                          <div className="text-blue-600">
                            <strong>Progress:</strong> {Math.round(((studentData.bus?.stops?.findIndex(stop => 
                              stop === (studentBusLocation.currentStop || '').replace('At ', '').replace('Near ', '').split(',')[0]
                            ) || 0) / (studentData.bus?.stops?.length - 1)) * 100)}%
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg">
                          <span className="font-semibold text-gray-700">Latitude</span>
                          <p className="text-blue-600 font-mono">{studentBusLocation.lat.toFixed(6)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <span className="font-semibold text-gray-700">Longitude</span>
                          <p className="text-blue-600 font-mono">{studentBusLocation.lng.toFixed(6)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <span className="font-semibold text-gray-700">Speed</span>
                          <p className="text-green-600 font-semibold">
                            {studentBusLocation.speed ? `${(studentBusLocation.speed * 3.6).toFixed(1)} km/h` : 'Stationary'}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <span className="font-semibold text-gray-700">Accuracy</span>
                          <p className="text-purple-600">
                            {studentBusLocation.accuracy ? `${studentBusLocation.accuracy.toFixed(0)}m` : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-gray-700">Last Update:</span>
                            <p className="text-gray-600">{new Date(studentBusLocation.timestamp).toLocaleString()}</p>
                          </div>
                          <button
                            onClick={() => window.open(`https://www.google.com/maps?q=${studentBusLocation.lat},${studentBusLocation.lng}`, '_blank')}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                          >
                            <span>📍</span>
                            <span>View on Google Maps</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🚌</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Bus Location Not Available</h3>
                    <p className="text-gray-500 mb-4">Your bus driver hasn't enabled GPS tracking yet</p>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-md mx-auto">
                      <h4 className="font-semibold text-blue-800 mb-2">Your Bus Details:</h4>
                      <div className="text-sm text-blue-700 text-left space-y-1">
                        <p><strong>Bus:</strong> {studentData.bus?.$oid === '66d0123456a1b2c3d4e5f601' ? 'BUS-001' : 'BUS-002'}</p>
                        <p><strong>Driver:</strong> {studentData.bus?.$oid === '66d0123456a1b2c3d4e5f601' ? 'Rajesh Kumar' : 'Suresh Singh'}</p>
                        <p><strong>Route:</strong> {studentData.bus?.$oid === '66d0123456a1b2c3d4e5f601' 
                          ? 'Route A - City Center to College'
                          : 'Route B - Airport to College'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="animate-fadeIn space-y-6">
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
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
