import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleMaps } from '../hooks/useGoogleMaps.js';
import { LocationService } from '../utils/locationService.js';
import { AttendanceDB } from '../utils/attendanceDB.js';
import GoogleMap from '../components/GoogleMap.jsx';

// Helper function to get user's current location
const getUserCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Cache for 1 minute
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(error);
      },
      options
    );
  });
};

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [realTimeLocations, setRealTimeLocations] = useState([]);
  const [activeTab, setActiveTab] = useState('location');
  const [studentBusLocation, setStudentBusLocation] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [presentDatesView, setPresentDatesView] = useState('grid'); // 'grid' or 'calendar'
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps('AIzaSyDRrEGi2nzH-3W2qqhOCFzZuRms5tGeYvI');

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem('studentData') || '{}');
    setStudentData(student);

    // Load student's bus location using real user location for route progress
    const loadStudentBusLocation = async () => {
      if (student.bus?.$oid) {
        // Try to get your actual location first
        let location = null;
        let isRealLocation = false;
        let locationSource = 'Simulated';
        
        try {
          // Get your actual browser location
          const userLocation = await getUserCurrentLocation();
          if (userLocation) {
            console.log('🗺️ Your GPS coordinates:', userLocation);
            
            // Debug: Check route data
            const route = LocationService.busRoutes[student.bus.$oid];
            console.log('📍 Available bus stops:', route?.map(stop => `${stop.name} (${stop.lat}, ${stop.lng})`));
            
            // Use your location with enhanced route calculations
            const busInfo = LocationService.busInfo[student.bus.$oid];
            const currentStop = LocationService.getCurrentStop(userLocation.lat, userLocation.lng, student.bus.$oid);
            const nextStop = LocationService.getNextStop(userLocation.lat, userLocation.lng, student.bus.$oid);
            const routeProgress = LocationService.getRouteProgress(userLocation.lat, userLocation.lng, student.bus.$oid);
            
            console.log('🔍 Enhanced location calculations:', {
              currentStop,
              nextStop,
              routeProgress: routeProgress.percentage + '%',
              progressStatus: routeProgress.status,
              details: routeProgress
            });
            
            location = {
              lat: userLocation.lat,
              lng: userLocation.lng,
              currentStop: currentStop,
              nextStop: nextStop,
              routeProgress: routeProgress.percentage,
              progressStatus: routeProgress.status,
              speed: 0, // Static when using user location
              accuracy: userLocation.accuracy,
              timestamp: Date.now(),
              distanceToCurrentStop: routeProgress.distanceToCurrentStop,
              distanceToNextStop: routeProgress.distanceToNextStop
            };
            isRealLocation = true;
            locationSource = 'Your Location';
            console.log('✅ Final location object for route progress:', location);
            console.log('🔧 Route progress value being set:', routeProgress.percentage);
            console.log('🎯 Is real location flag:', isRealLocation);
          }
        } catch (error) {
          console.log('Could not get your location, trying driver GPS:', error.message);
          
          // Fallback to driver GPS location
          location = LocationService.getRealLocation(student.bus.$oid);
          if (location) {
            isRealLocation = true;
            locationSource = 'Driver GPS';
            console.log('Using driver GPS location:', location);
          }
        }
        
        // Final fallback - only if no driver GPS available
        if (!location) {
          console.log('❌ No driver GPS available for bus:', student.bus.$oid);
          setStudentBusLocation(null);
          return;
        }
        
            // Enhanced location with bus info - only for real GPS locations
            const busInfo = LocationService.busInfo[student.bus.$oid];
            const enhancedLocation = {
              ...location,
              busId: student.bus.$oid,
              busNumber: busInfo?.busNumber || 'Unknown',
              route: busInfo?.route || 'Unknown Route',
              driverName: busInfo?.driver || 'Unknown Driver',
              lastUpdated: new Date(location.lastUpdated || Date.now()).toLocaleTimeString(),
              isRealLocation: isRealLocation,
              locationSource: locationSource
            };
            
            console.log('🏗️ Enhanced location object created:', {
              routeProgress: enhancedLocation.routeProgress,
              isRealLocation: enhancedLocation.isRealLocation,
              currentStop: enhancedLocation.currentStop,
              locationSource: enhancedLocation.locationSource
            });
            
            setStudentBusLocation(enhancedLocation);
            console.log(`${locationSource} location loaded:`, enhancedLocation);
            
            // Debug route progress calculation - only for real GPS
            if (enhancedLocation.currentStop && student.bus?.stops && isRealLocation) {
              const cleanCurrentStop = enhancedLocation.currentStop
                .replace('Arrived at ', '')
                .replace('Left ', '')
                .replace('At ', '')
                .replace('Near ', '')
                .replace('Approaching ', '')
                .replace('En route to ', '')
                .split(',')[0]
                .trim();
              
              const currentStopIndex = student.bus.stops.findIndex(stop => 
                stop.toLowerCase().includes(cleanCurrentStop.toLowerCase()) ||
                cleanCurrentStop.toLowerCase().includes(stop.toLowerCase())
              );
              
              // Use the route progress from LocationService (GPS-based)
              const locationServiceProgress = enhancedLocation.routeProgress || 0;
              
              console.log('🛤️ Route Progress Debug:', {
                rawCurrentStop: enhancedLocation.currentStop,
                cleanCurrentStop,
                currentStopIndex,
                locationServiceProgress: locationServiceProgress + '% (GPS-based)',
                usingLocationServiceProgress: true,
                availableStops: student.bus.stops
              });
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

  // Load student attendance records
  const loadAttendanceData = async () => {
    if (!studentData?.rollNo) return;
    
    setAttendanceLoading(true);
    try {
      const monthlyRecords = await AttendanceDB.getStudentAttendanceByMonth(
        studentData.rollNo, 
        selectedYear, 
        selectedMonth
      );
      setAttendanceRecords(monthlyRecords);
      console.log('📊 Loaded attendance records for', studentData.rollNo, ':', monthlyRecords);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Load attendance data when tab changes to attendance or month/year changes
  useEffect(() => {
    if (activeTab === 'attendance' && studentData?.rollNo) {
      loadAttendanceData();
    }
  }, [activeTab, selectedMonth, selectedYear, studentData?.rollNo]);

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
              onClick={() => setActiveTab('attendance')}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center space-x-2 ${
                activeTab === 'attendance' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl transform scale-105' 
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              <span>📊</span>
              <span>My Attendance</span>
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
                          <div className={`w-3 h-3 rounded-full animate-pulse ${
                            studentBusLocation.isRealLocation ? 'bg-green-500' : 'bg-blue-500'
                          }`}></div>
                          <span className={`font-semibold ${
                            studentBusLocation.isRealLocation ? 'text-green-600' : 'text-blue-600'
                          }`}>
                            {studentBusLocation.locationSource || 'Live'}
                          </span>
                        </div>
                      </div>

                      {/* Current Stop Information */}
                      <div className="mb-6 p-4 bg-white rounded-xl border-2 border-green-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-lg font-bold text-green-800 flex items-center">
                            🚏 <span className="ml-2">Current Location</span>
                          </h5>
                          <div className="flex items-center space-x-2">
                            <span className={`bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold ${
                              studentBusLocation.progressStatus === 'arrived' ? 'bg-green-500 text-green-800' :
                              studentBusLocation.progressStatus === 'approaching' ? 'bg-blue-500 text-blue-800' :
                              studentBusLocation.progressStatus === 'left' ? 'bg-orange-500 text-orange-800' :
                              studentBusLocation.progressStatus === 'enroute' ? 'bg-purple-500 text-purple-800' :
                              'bg-gray-500 text-gray-800'
                            }`}>
                              {studentBusLocation.progressStatus === 'arrived' ? '🎯 Arrived' :
                               studentBusLocation.progressStatus === 'approaching' ? '🔜 Approaching' :
                               studentBusLocation.progressStatus === 'left' ? '🚶 Left Stop' :
                               studentBusLocation.progressStatus === 'enroute' ? '🛣️ En Route' :
                               'Active'}
                            </span>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-green-700 mb-2">
                          {studentBusLocation.currentStop || 'En Route'}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <p className="text-gray-600">
                            <strong>Next Stop:</strong> {studentBusLocation.nextStop || 'Unknown'}
                          </p>
                          {studentBusLocation.distanceToCurrentStop && (
                            <p className="text-blue-600">
                              <strong>Distance to Current:</strong> {(studentBusLocation.distanceToCurrentStop * 1000).toFixed(0)}m
                            </p>
                          )}
                          {studentBusLocation.distanceToNextStop && (
                            <p className="text-purple-600">
                              <strong>Distance to Next:</strong> {(studentBusLocation.distanceToNextStop * 1000).toFixed(0)}m
                            </p>
                          )}
                          {studentBusLocation.estimatedArrival && (
                            <p className="text-orange-600">
                              <strong>ETA to Next Stop:</strong> {studentBusLocation.estimatedArrival}
                            </p>
                          )}
                        </div>
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
                              width: `${(() => {
                                console.log('🔍 Progress bar calculation - studentBusLocation:', {
                                  isRealLocation: studentBusLocation?.isRealLocation,
                                  routeProgress: studentBusLocation?.routeProgress,
                                  progressStatus: studentBusLocation?.progressStatus,
                                  currentStop: studentBusLocation?.currentStop,
                                  locationSource: studentBusLocation?.locationSource
                                });
                                
                                // Use GPS-based route progress if available (more accurate for real location)
                                if (studentBusLocation?.isRealLocation && studentBusLocation?.routeProgress >= 0) {
                                  console.log('🎯 Using GPS-based progress for progress bar:', studentBusLocation.routeProgress);
                                  return Math.min(100, Math.max(0, studentBusLocation.routeProgress));
                                }
                                
                                // Fallback to string-based matching for simulated locations
                                if (!studentBusLocation?.currentStop || !studentData.bus?.stops) return 0;
                                
                                // Extract clean stop name from current location
                                const cleanCurrentStop = studentBusLocation.currentStop
                                  .replace('At ', '')
                                  .replace('Near ', '')
                                  .replace('Approaching ', '')
                                  .replace('En route to ', '')
                                  .split(',')[0]
                                  .trim();
                                
                                // Find the index of current stop
                                const currentStopIndex = studentData.bus.stops.findIndex(stop => 
                                  stop.toLowerCase().includes(cleanCurrentStop.toLowerCase()) ||
                                  cleanCurrentStop.toLowerCase().includes(stop.toLowerCase())
                                );
                                
                                // Calculate progress percentage
                                const progressPercentage = currentStopIndex >= 0 ? 
                                  (currentStopIndex / (studentData.bus.stops.length - 1)) * 100 : 0;
                                
                                console.log('📊 Using string-based progress for progress bar:', progressPercentage);
                                return Math.min(100, Math.max(0, progressPercentage));
                              })()}%` 
                            }}
                          ></div>

                          {/* Stops */}
                          <div className="flex justify-between items-center relative">
                            {studentData.bus?.stops?.map((stop, index) => {
                              // Check if this stop matches the current location based on GPS progress
                              const currentStop = studentBusLocation?.currentStop || '';
                              
                              // Enhanced stop matching logic for GPS-based locations
                              let isCurrentStop = false;
                              let isPassed = false;
                              let isNext = false;
                              
                              if (studentBusLocation?.isRealLocation && studentBusLocation?.progressStatus) {
                                // Use GPS-based progress status for more accurate display
                                const progressStatus = studentBusLocation.progressStatus;
                                const routeProgress = studentBusLocation.routeProgress || 0;
                                
                                // Calculate current stop index based on route progress
                                const progressBasedStopIndex = Math.floor((routeProgress / 100) * (studentData.bus.stops.length - 1));
                                
                                // Determine stop status based on GPS progress
                                if (progressStatus === 'arrived' && index === progressBasedStopIndex) {
                                  isCurrentStop = true;
                                } else if (progressStatus === 'approaching' && index === progressBasedStopIndex + 1) {
                                  isNext = true;
                                } else if (index < progressBasedStopIndex) {
                                  isPassed = true;
                                } else if (progressStatus === 'left' && index === progressBasedStopIndex) {
                                  // Just left this stop
                                  isPassed = true;
                                }
                              } else {
                                // Fallback to string matching for simulated locations
                                const cleanCurrentStop = currentStop
                                  .replace('Arrived at ', '')
                                  .replace('Approaching ', '')
                                  .replace('Left ', '')
                                  .replace('At ', '')
                                  .replace('Near ', '')
                                  .replace('En route to ', '')
                                  .split(',')[0]
                                  .trim();
                                
                                isCurrentStop = cleanCurrentStop && (
                                  stop.toLowerCase().includes(cleanCurrentStop.toLowerCase()) ||
                                  cleanCurrentStop.toLowerCase().includes(stop.toLowerCase())
                                );
                                
                                // Find current stop index for comparison
                                const currentStopIndex = studentData.bus.stops.findIndex(s => 
                                  cleanCurrentStop && (
                                    s.toLowerCase().includes(cleanCurrentStop.toLowerCase()) ||
                                    cleanCurrentStop.toLowerCase().includes(s.toLowerCase())
                                  )
                                );
                                
                                isPassed = currentStopIndex >= 0 && index < currentStopIndex;
                                isNext = currentStopIndex >= 0 && index === currentStopIndex + 1;
                              }
                              
                              return (
                                <div key={index} className="flex flex-col items-center relative z-10">
                                  {/* Stop Circle */}
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                    isCurrentStop 
                                      ? 'bg-green-500 border-green-500 shadow-lg scale-110' :
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
                                        {studentBusLocation?.progressStatus === 'arrived' ? 'Arrived' :
                                         studentBusLocation?.progressStatus === 'left' ? 'Left' : 'Current'}
                                      </span>
                                    )}
                                    {isNext && (
                                      <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                        {studentBusLocation?.progressStatus === 'approaching' ? 'Approaching' : 'Next'}
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

                          {/* Moving Bus Icon with Status */}
                          <div 
                            className="absolute -top-2 transform -translate-x-1/2 transition-all duration-1000"
                            style={{ 
                              left: `${(() => {
                                // Use GPS-based route progress if available (more accurate for real location)
                                if (studentBusLocation?.isRealLocation && studentBusLocation?.routeProgress >= 0) {
                                  return Math.min(100, Math.max(0, studentBusLocation.routeProgress));
                                }
                                
                                // Fallback to string-based calculation for simulated
                                if (!studentBusLocation?.currentStop || !studentData.bus?.stops) return 0;
                                
                                const cleanCurrentStop = studentBusLocation.currentStop
                                  .replace('Arrived at ', '')
                                  .replace('Approaching ', '')
                                  .replace('Left ', '')
                                  .replace('At ', '')
                                  .replace('Near ', '')
                                  .replace('En route to ', '')
                                  .split(',')[0]
                                  .trim();
                                
                                const currentStopIndex = studentData.bus.stops.findIndex(stop => 
                                  stop.toLowerCase().includes(cleanCurrentStop.toLowerCase()) ||
                                  cleanCurrentStop.toLowerCase().includes(stop.toLowerCase())
                                );
                                
                                const progressPercentage = currentStopIndex >= 0 ? 
                                  (currentStopIndex / (studentData.bus.stops.length - 1)) * 100 : 0;
                                
                                return Math.min(100, Math.max(0, progressPercentage));
                              })()}%` 
                            }}
                          >
                            <div className={`text-white p-2 rounded-full shadow-lg ${
                              studentBusLocation?.progressStatus === 'arrived' ? 'bg-green-500 animate-bounce' :
                              studentBusLocation?.progressStatus === 'approaching' ? 'bg-blue-500 animate-pulse' :
                              studentBusLocation?.progressStatus === 'left' ? 'bg-orange-500' :
                              'bg-blue-500 animate-bounce'
                            }`}>
                              🚌
                            </div>
                            {/* Status indicator below bus */}
                            {studentBusLocation?.progressStatus && (
                              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                  studentBusLocation.progressStatus === 'arrived' ? 'bg-green-500 text-white' :
                                  studentBusLocation.progressStatus === 'approaching' ? 'bg-blue-500 text-white' :
                                  studentBusLocation.progressStatus === 'left' ? 'bg-orange-500 text-white' :
                                  studentBusLocation.progressStatus === 'enroute' ? 'bg-purple-500 text-white' :
                                  'bg-gray-500 text-white'
                                }`}>
                                  {studentBusLocation.progressStatus === 'arrived' ? '🎯 Arrived' :
                                   studentBusLocation.progressStatus === 'approaching' ? '🔜 Approaching' :
                                   studentBusLocation.progressStatus === 'left' ? '🚶 Left' :
                                   studentBusLocation.progressStatus === 'enroute' ? '�️ En Route' :
                                   'Moving'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Route Summary */}
                        <div className="mt-6 flex justify-between items-center text-sm">
                          <div className="text-gray-600">
                            <strong>Route:</strong> {studentBusLocation?.route || 'MIET to Muzaffarnagar'}
                          </div>
                          <div className="text-blue-600">
                            <strong>Progress:</strong> {(() => {
                              // Use GPS-based route progress if available (more accurate for real location)
                              if (studentBusLocation?.isRealLocation && studentBusLocation?.routeProgress >= 0) {
                                const status = studentBusLocation.progressStatus === 'arrived' ? ' (Arrived)' :
                                              studentBusLocation.progressStatus === 'approaching' ? ' (Approaching)' :
                                              studentBusLocation.progressStatus === 'left' ? ' (Left Stop)' :
                                              studentBusLocation.progressStatus === 'enroute' ? ' (En Route)' : '';
                                return `${Math.min(100, Math.max(0, studentBusLocation.routeProgress))}%${status}`;
                              }
                              
                              // Fallback to string-based calculation for simulated
                              if (!studentBusLocation?.currentStop || !studentData.bus?.stops) return '0%';
                              
                              const cleanCurrentStop = studentBusLocation.currentStop
                                .replace('At ', '')
                                .replace('Near ', '')
                                .replace('Approaching ', '')
                                .replace('En route to ', '')
                                .split(',')[0]
                                .trim();
                              
                              const currentStopIndex = studentData.bus.stops.findIndex(stop => 
                                stop.toLowerCase().includes(cleanCurrentStop.toLowerCase()) ||
                                cleanCurrentStop.toLowerCase().includes(stop.toLowerCase())
                              );
                              
                              const progressPercentage = currentStopIndex >= 0 ? 
                                Math.round((currentStopIndex / (studentData.bus.stops.length - 1)) * 100) : 0;
                              
                              return `${Math.min(100, Math.max(0, progressPercentage))}%`;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="bg-white p-3 rounded-lg">
                          <span className="font-semibold text-gray-700">Latitude</span>
                          <p className="text-blue-600 font-mono">{studentBusLocation.lat.toFixed(6)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <span className="font-semibold text-gray-700">Longitude</span>
                          <p className="text-blue-600 font-mono">{studentBusLocation.lng.toFixed(6)}</p>
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

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="animate-fadeIn space-y-6">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              <div className="p-8 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                  📊 <span className="ml-3">My Attendance Records</span>
                </h2>
                <p className="text-green-100 text-lg">Track your monthly attendance for morning and evening trips</p>
              </div>
              
              <div className="p-6">
                {/* Month/Year Selector */}
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                    📅 <span className="ml-2">Select Month & Year</span>
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-blue-700 mb-2">Month</label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <option key={index} value={index}>{month}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-blue-700 mb-2">Year</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-4 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Attendance Summary */}
                {!attendanceLoading && (() => {
                  // Group records by date to show morning/evening breakdown
                  const groupedByDate = {};
                  attendanceRecords.forEach(record => {
                    if (!groupedByDate[record.date]) {
                      groupedByDate[record.date] = {};
                    }
                    groupedByDate[record.date][record.tripType] = record.status;
                  });

                  const morningPresent = attendanceRecords.filter(r => r.tripType === 'home-to-campus' && r.status === 'present').length;
                  const morningAbsent = attendanceRecords.filter(r => r.tripType === 'home-to-campus' && r.status === 'absent').length;
                  const eveningPresent = attendanceRecords.filter(r => r.tripType === 'campus-to-home' && r.status === 'present').length;
                  const eveningAbsent = attendanceRecords.filter(r => r.tripType === 'campus-to-home' && r.status === 'absent').length;
                  
                  const totalDays = Object.keys(groupedByDate).length;
                  const fullDayPresent = Object.values(groupedByDate).filter(day => 
                    day['home-to-campus'] === 'present' && day['campus-to-home'] === 'present'
                  ).length;
                  const partialPresent = Object.values(groupedByDate).filter(day => 
                    (day['home-to-campus'] === 'present' && day['campus-to-home'] === 'absent') ||
                    (day['home-to-campus'] === 'absent' && day['campus-to-home'] === 'present')
                  ).length;

                  return (
                    <div className="mb-6 space-y-4">
                      {/* Main Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                              <span className="text-white text-xl">🌅</span>
                            </div>
                            <div>
                              <p className="text-green-800 font-semibold">Morning Present</p>
                              <p className="text-2xl font-bold text-green-600">{morningPresent}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                              <span className="text-white text-xl">🌆</span>
                            </div>
                            <div>
                              <p className="text-orange-800 font-semibold">Evening Present</p>
                              <p className="text-2xl font-bold text-orange-600">{eveningPresent}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                              <span className="text-white text-xl">📅</span>
                            </div>
                            <div>
                              <p className="text-blue-800 font-semibold">Full Day Present</p>
                              <p className="text-2xl font-bold text-blue-600">{fullDayPresent}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                              <span className="text-white text-xl">⚡</span>
                            </div>
                            <div>
                              <p className="text-purple-800 font-semibold">Partial Present</p>
                              <p className="text-2xl font-bold text-purple-600">{partialPresent}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Detailed Breakdown */}
                      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-xl border border-indigo-200">
                        <h4 className="text-lg font-bold text-indigo-800 mb-3 flex items-center">
                          📊 <span className="ml-2">Attendance Breakdown</span>
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-indigo-700 font-semibold">Morning Absent</p>
                            <p className="text-xl font-bold text-red-600">{morningAbsent}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-indigo-700 font-semibold">Evening Absent</p>
                            <p className="text-xl font-bold text-red-600">{eveningAbsent}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-indigo-700 font-semibold">Total Days</p>
                            <p className="text-xl font-bold text-indigo-600">{totalDays}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-indigo-700 font-semibold">Overall %</p>
                            <p className="text-xl font-bold text-indigo-600">
                              {attendanceRecords.length > 0 
                                ? Math.round(((morningPresent + eveningPresent) / attendanceRecords.length) * 100)
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Loading State */}
                {attendanceLoading && (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mb-4"></div>
                    <p className="text-gray-600">Loading attendance records...</p>
                  </div>
                )}

                {/* Attendance Records */}
                {!attendanceLoading && attendanceRecords.length > 0 && (() => {
                  // Group records by date
                  const groupedByDate = {};
                  attendanceRecords.forEach(record => {
                    if (!groupedByDate[record.date]) {
                      groupedByDate[record.date] = {
                        date: record.date,
                        morning: null,
                        evening: null
                      };
                    }
                    if (record.tripType === 'home-to-campus') {
                      groupedByDate[record.date].morning = record;
                    } else {
                      groupedByDate[record.date].evening = record;
                    }
                  });

                  // Sort dates in descending order (newest first)
                  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

                  return (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center">
                          📋 <span className="ml-2">Daily Attendance Records - {[
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                          ][selectedMonth]} {selectedYear}</span>
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">Morning and evening attendance for each day</p>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {sortedDates.map((date, index) => {
                          const dayData = groupedByDate[date];
                          const morningStatus = dayData.morning?.status;
                          const eveningStatus = dayData.evening?.status;
                          
                          // Determine overall day status
                          let dayStatusColor = 'bg-gray-50';
                          let dayStatusIcon = '⚪';
                          let dayStatusText = 'No Data';
                          
                          if (morningStatus === 'present' && eveningStatus === 'present') {
                            dayStatusColor = 'bg-green-50';
                            dayStatusIcon = '🟢';
                            dayStatusText = 'Full Day Present';
                          } else if (morningStatus === 'present' || eveningStatus === 'present') {
                            dayStatusColor = 'bg-yellow-50';
                            dayStatusIcon = '🟡';
                            dayStatusText = 'Partially Present';
                          } else if (morningStatus === 'absent' || eveningStatus === 'absent') {
                            dayStatusColor = 'bg-red-50';
                            dayStatusIcon = '🔴';
                            dayStatusText = 'Absent';
                          }

                          return (
                            <div key={date} className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${dayStatusColor} border-2 border-gray-200`}>
                                    {dayStatusIcon}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-800 text-lg">
                                      {new Date(date).toLocaleDateString('en-US', { 
                                        weekday: 'long', 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                      })}
                                    </p>
                                    <p className="text-sm text-gray-600">{dayStatusText}</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Morning and Evening Status */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {/* Morning Trip */}
                                <div className={`p-3 rounded-lg border-2 ${
                                  morningStatus === 'present' 
                                    ? 'bg-green-50 border-green-200' 
                                    : morningStatus === 'absent'
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">🌅</span>
                                      <div>
                                        <p className="font-semibold text-gray-800">Morning Trip</p>
                                        <p className="text-xs text-gray-600">🏠➡️🏫 Home to Campus</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {morningStatus ? (
                                        <>
                                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                                            morningStatus === 'present' 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {morningStatus === 'present' ? '✅ Present' : '❌ Absent'}
                                          </span>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {dayData.morning?.time} • {dayData.morning?.driverName}
                                          </p>
                                        </>
                                      ) : (
                                        <span className="text-xs text-gray-400">No record</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Evening Trip */}
                                <div className={`p-3 rounded-lg border-2 ${
                                  eveningStatus === 'present' 
                                    ? 'bg-green-50 border-green-200' 
                                    : eveningStatus === 'absent'
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-lg">🌆</span>
                                      <div>
                                        <p className="font-semibold text-gray-800">Evening Trip</p>
                                        <p className="text-xs text-gray-600">🏫➡️🏠 Campus to Home</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      {eveningStatus ? (
                                        <>
                                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                                            eveningStatus === 'present' 
                                              ? 'bg-green-100 text-green-800' 
                                              : 'bg-red-100 text-red-800'
                                          }`}>
                                            {eveningStatus === 'present' ? '✅ Present' : '❌ Absent'}
                                          </span>
                                          <p className="text-xs text-gray-500 mt-1">
                                            {dayData.evening?.time} • {dayData.evening?.driverName}
                                          </p>
                                        </>
                                      ) : (
                                        <span className="text-xs text-gray-400">No record</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Present Dates Section */}
                {!attendanceLoading && attendanceRecords.length > 0 && (() => {
                  // Get all dates where student was present (either morning or evening)
                  const presentDates = [];
                  const groupedByDate = {};
                  
                  attendanceRecords.forEach(record => {
                    if (!groupedByDate[record.date]) {
                      groupedByDate[record.date] = {
                        date: record.date,
                        morning: null,
                        evening: null
                      };
                    }
                    if (record.tripType === 'home-to-campus') {
                      groupedByDate[record.date].morning = record.status;
                    } else {
                      groupedByDate[record.date].evening = record.status;
                    }
                  });

                  // Filter dates where student was present at least once
                  Object.values(groupedByDate).forEach(day => {
                    if (day.morning === 'present' || day.evening === 'present') {
                      presentDates.push({
                        date: day.date,
                        morningPresent: day.morning === 'present',
                        eveningPresent: day.evening === 'present',
                        fullDay: day.morning === 'present' && day.evening === 'present'
                      });
                    }
                  });

                  // Sort dates in descending order (newest first)
                  presentDates.sort((a, b) => new Date(b.date) - new Date(a.date));

                  return presentDates.length > 0 && (
                    <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-green-800 flex items-center">
                          📅 <span className="ml-2">Dates When You Were Present</span>
                        </h3>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setPresentDatesView('grid')}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                              presentDatesView === 'grid' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-white text-green-700 hover:bg-green-100'
                            }`}
                          >
                            📋 Grid View
                          </button>
                          <button
                            onClick={() => setPresentDatesView('list')}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                              presentDatesView === 'list' 
                                ? 'bg-green-500 text-white' 
                                : 'bg-white text-green-700 hover:bg-green-100'
                            }`}
                          >
                            📃 List View
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-green-700 mb-4 text-sm">
                        All dates in {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ][selectedMonth]} {selectedYear} when you attended at least one trip ({presentDates.length} days)
                      </p>
                      
                      {/* Grid View */}
                      {presentDatesView === 'grid' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {presentDates.map((dateInfo, index) => (
                            <div key={dateInfo.date} className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                              dateInfo.fullDay 
                                ? 'bg-green-100 border-green-300' 
                                : 'bg-yellow-100 border-yellow-300'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">
                                    {dateInfo.fullDay ? '🟢' : '🟡'}
                                  </span>
                                  <div>
                                    <p className="font-bold text-gray-800">
                                      {new Date(dateInfo.date).toLocaleDateString('en-US', { 
                                        weekday: 'short',
                                        month: 'short', 
                                        day: 'numeric'
                                      })}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {new Date(dateInfo.date).toLocaleDateString('en-US', { 
                                        year: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                    dateInfo.fullDay 
                                      ? 'bg-green-200 text-green-800' 
                                      : 'bg-yellow-200 text-yellow-800'
                                  }`}>
                                    {dateInfo.fullDay ? 'Full Day' : 'Partial'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Morning/Evening Status */}
                              <div className="flex justify-between text-xs">
                                <div className="flex items-center space-x-1">
                                  <span className="text-orange-600">🌅</span>
                                  <span className={dateInfo.morningPresent ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                                    {dateInfo.morningPresent ? 'Present' : 'Absent'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className="text-purple-600">🌆</span>
                                  <span className={dateInfo.eveningPresent ? 'text-green-600 font-semibold' : 'text-gray-400'}>
                                    {dateInfo.eveningPresent ? 'Present' : 'Absent'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* List View */}
                      {presentDatesView === 'list' && (
                        <div className="bg-white rounded-lg border border-green-200 overflow-hidden">
                          <div className="max-h-64 overflow-y-auto">
                            {presentDates.map((dateInfo, index) => (
                              <div key={dateInfo.date} className={`flex items-center justify-between p-3 border-b border-green-100 hover:bg-green-50 transition-colors ${
                                index % 2 === 0 ? 'bg-white' : 'bg-green-25'
                              }`}>
                                <div className="flex items-center space-x-3">
                                  <span className="text-xl">
                                    {dateInfo.fullDay ? '🟢' : '🟡'}
                                  </span>
                                  <div>
                                    <p className="font-semibold text-gray-800">
                                      {new Date(dateInfo.date).toLocaleDateString('en-US', { 
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long', 
                                        day: 'numeric'
                                      })}
                                    </p>
                                    <div className="flex space-x-4 text-xs text-gray-600">
                                      <span className={dateInfo.morningPresent ? 'text-green-600' : 'text-gray-400'}>
                                        🌅 {dateInfo.morningPresent ? 'Morning ✅' : 'Morning ❌'}
                                      </span>
                                      <span className={dateInfo.eveningPresent ? 'text-green-600' : 'text-gray-400'}>
                                        🌆 {dateInfo.eveningPresent ? 'Evening ✅' : 'Evening ❌'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                                  dateInfo.fullDay 
                                    ? 'bg-green-200 text-green-800' 
                                    : 'bg-yellow-200 text-yellow-800'
                                }`}>
                                  {dateInfo.fullDay ? 'Full Day' : 'Partial'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Quick Stats */}
                      <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-800 font-semibold">Present Days Summary:</span>
                          <div className="flex space-x-4">
                            <span className="text-green-600">
                              🟢 Full Days: {presentDates.filter(d => d.fullDay).length}
                            </span>
                            <span className="text-yellow-600">
                              🟡 Partial Days: {presentDates.filter(d => !d.fullDay).length}
                            </span>
                            <span className="text-blue-600">
                              📊 Total Present: {presentDates.length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* No Records State */}
                {!attendanceLoading && attendanceRecords.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Attendance Records</h3>
                    <p className="text-gray-500">
                      No attendance records found for {[
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                      ][selectedMonth]} {selectedYear}.
                    </p>
                    <p className="text-gray-500 mt-2">
                      Attendance records are created when drivers submit attendance data.
                    </p>
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
