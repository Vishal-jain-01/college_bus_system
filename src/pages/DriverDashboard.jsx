import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttendanceDB } from '../utils/attendanceDB.js';
import { LocationService } from '../utils/locationService.js';
import { ExcelExportService } from '../utils/excelExport.js';

export default function DriverDashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [driverData, setDriverData] = useState(null);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletingAttendance, setIsCompletingAttendance] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [tripType, setTripType] = useState('home-to-campus');
  const [existingRecords, setExistingRecords] = useState({
    'home-to-campus': null,
    'campus-to-home': null
  });
  const [showPresentList, setShowPresentList] = useState(false);
  const [locallySavedCounts, setLocallySavedCounts] = useState({
    'home-to-campus': 0,
    'campus-to-home': 0
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    const driver = JSON.parse(localStorage.getItem('driverData') || '{}');
    setDriverData(driver);

    // Load existing attendance records for today
    loadTodayRecords(driver.busId);

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
        
        // Update locally saved counts after students are loaded
        setTimeout(() => updateLocallySavedCounts(), 100);
      })
      .catch(err => console.error('Error loading student data:', err));
  }, []);

  // Update locally saved counts periodically
  useEffect(() => {
    if (driverData?.busId) {
      updateLocallySavedCounts();
      const interval = setInterval(updateLocallySavedCounts, 3000); // Check every 3 seconds
      return () => clearInterval(interval);
    }
  }, [driverData]);

  // GPS Location tracking useEffect
  useEffect(() => {
    if (!driverData?.busId) return;

    const startLocationTracking = () => {
      setIsTrackingLocation(true);
      setLocationError('');

      if (navigator.geolocation) {
        const trackLocation = () => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                timestamp: new Date().toISOString(),
                busId: driverData.busId,
                driverName: driverData.name,
                speed: position.coords.speed || 0,
                accuracy: position.coords.accuracy
              };

              console.log('📍 Driver GPS location captured:', location);
              console.log('🌐 Backend URL:', import.meta.env.VITE_BACKEND_URL);
              setCurrentLocation(location);
              
              // Send location to backend API AND localStorage for cross-device sync
              LocationService.saveRealLocation(location)
                .then(result => {
                  if (result.success) {
                    console.log('✅ Location posted to backend API successfully');
                  } else {
                    console.log('⚠️ Backend API post failed, using localStorage only');
                  }
                })
                .catch(error => {
                  console.log('⚠️ Location API error:', error.message);
                });
              
              setLocationError('');
            },
            (error) => {
              console.error('Location error:', error);
              setLocationError(`GPS Error: ${error.message}`);
              setIsTrackingLocation(false);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          );
        };

        // Track location immediately
        trackLocation();
        
        // Then track every 10 seconds
        const locationInterval = setInterval(trackLocation, 10000);

        return () => clearInterval(locationInterval);
      } else {
        setLocationError('GPS not supported by this device');
        setIsTrackingLocation(false);
      }
    };

    startLocationTracking();
  }, [driverData]);

  const loadTodayRecords = async (busId) => {
    if (!busId) return;
    
    const today = new Date().toISOString().split('T')[0];
    const records = await AttendanceDB.getAttendanceByBusAndDate(busId, today);
    
    const recordsMap = {
      'home-to-campus': records.find(r => r.tripType === 'home-to-campus') || null,
      'campus-to-home': records.find(r => r.tripType === 'campus-to-home') || null
    };
    
    setExistingRecords(recordsMap);
    
    // If there's an existing record for current trip type, load its attendance
    if (recordsMap[tripType]) {
      const existingAttendance = {};
      students.forEach(student => {
        const isPresent = recordsMap[tripType].presentStudents.some(p => p.rollNo === student.rollNo);
        existingAttendance[student.rollNo] = isPresent;
      });
      setAttendance(existingAttendance);
    }
  };

  // Function to update locally saved attendance counts
  const updateLocallySavedCounts = () => {
    if (!driverData?.busId) return;
    
    const today = new Date().toISOString().split('T')[0];
    const morningKey = `attendance_${driverData.busId}_home-to-campus_${today}`;
    const eveningKey = `attendance_${driverData.busId}_campus-to-home_${today}`;
    
    const morningData = localStorage.getItem(morningKey);
    const eveningData = localStorage.getItem(eveningKey);
    
    setLocallySavedCounts({
      'home-to-campus': morningData ? JSON.parse(morningData).presentStudents.length : 0,
      'campus-to-home': eveningData ? JSON.parse(eveningData).presentStudents.length : 0
    });

    // Load saved attendance for current trip type if available
    const currentKey = `attendance_${driverData.busId}_${tripType}_${today}`;
    const currentData = localStorage.getItem(currentKey);
    if (currentData && students.length > 0) {
      const savedAttendance = JSON.parse(currentData);
      const loadedAttendance = {};
      
      students.forEach(student => {
        const isPresent = savedAttendance.presentStudents.some(p => p.rollNo === student.rollNo);
        loadedAttendance[student.rollNo] = isPresent;
      });
      
      setAttendance(loadedAttendance);
      
      // Show message if this attendance was already submitted
      if (savedAttendance.status === 'submitted') {
        setSubmitMessage(`ℹ️ This ${tripType === 'home-to-campus' ? 'morning' : 'evening'} attendance was already submitted on ${new Date(savedAttendance.submissionTime).toLocaleString()}`);
      }
    }
  };

  const handleTripTypeChange = (newTripType) => {
    setTripType(newTripType);
    setSubmitMessage(''); // Clear any previous messages
    
    // First check for locally saved attendance data
    const today = new Date().toISOString().split('T')[0];
    const localKey = `attendance_${driverData.busId}_${newTripType}_${today}`;
    const localData = localStorage.getItem(localKey);
    
    if (localData) {
      // Load from localStorage (driver's saved/submitted data)
      const savedAttendance = JSON.parse(localData);
      const loadedAttendance = {};
      
      students.forEach(student => {
        const isPresent = savedAttendance.presentStudents.some(p => p.rollNo === student.rollNo);
        loadedAttendance[student.rollNo] = isPresent;
      });
      
      setAttendance(loadedAttendance);
      
      // Show status message
      if (savedAttendance.status === 'submitted') {
        setSubmitMessage(`ℹ️ This ${newTripType === 'home-to-campus' ? 'morning' : 'evening'} attendance was already submitted on ${new Date(savedAttendance.submissionTime).toLocaleString()}`);
      } else {
        setSubmitMessage(`💾 Loaded your saved ${newTripType === 'home-to-campus' ? 'morning' : 'evening'} attendance`);
      }
    } else if (existingRecords[newTripType]) {
      // Load from existing records (admin system data)
      const existingAttendance = {};
      students.forEach(student => {
        const isPresent = existingRecords[newTripType].presentStudents.some(p => p.rollNo === student.rollNo);
        existingAttendance[student.rollNo] = isPresent;
      });
      setAttendance(existingAttendance);
    } else {
      // Reset attendance for new trip
      const resetAttendance = {};
      students.forEach(student => {
        resetAttendance[student.rollNo] = false;
      });
      setAttendance(resetAttendance);
    }
  };

  const toggleAttendance = (rollNo) => {
    setAttendance(prev => ({
      ...prev,
      [rollNo]: !prev[rollNo]
    }));
  };

  // Save attendance locally on driver dashboard
  const saveAttendanceLocally = async () => {
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
        tripType: tripType,
        presentStudents: presentStudents,
        absentStudents: absentStudents,
        totalStudents: students.length,
        route: driverData.busId === '66d0123456a1b2c3d4e5f601' ? 'Route A - City Center to College' : 'Route B - Airport to College',
        notes: `${tripType} attendance saved locally by ${driverData.name}`,
        status: 'saved' // Not yet submitted to admin
      };

      // Save locally in driver's session storage for now
      const localKey = `attendance_${driverData.busId}_${tripType}_${new Date().toISOString().split('T')[0]}`;
      localStorage.setItem(localKey, JSON.stringify(attendanceData));
      
      setSubmitMessage(`💾 Attendance saved locally! You can submit it when you reach the destination.`);
      
      // Update existing records for local display
      setExistingRecords(prev => ({
        ...prev,
        [tripType]: attendanceData
      }));
      
      // Update locally saved counts
      updateLocallySavedCounts();

    } catch (error) {
      setSubmitMessage(`❌ Error saving attendance: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit attendance to admin dashboard (only when at correct location)
  const submitAttendanceToAdmin = async () => {
    setIsCompletingAttendance(true);
    setSubmitMessage('');

    try {
      // Check if already submitted
      if (isCurrentAttendanceSubmitted()) {
        setSubmitMessage(`ℹ️ This ${tripType === 'home-to-campus' ? 'morning' : 'evening'} attendance was already submitted`);
        setIsCompletingAttendance(false);
        return;
      }

      // Get the locally saved attendance
      const localKey = `attendance_${driverData.busId}_${tripType}_${new Date().toISOString().split('T')[0]}`;
      const savedAttendance = localStorage.getItem(localKey);
      
      if (!savedAttendance) {
        setSubmitMessage(`❌ Please save attendance first before submitting!`);
        return;
      }

      const attendanceData = JSON.parse(savedAttendance);
      attendanceData.status = 'submitted'; // Mark as submitted
      attendanceData.submissionTime = new Date().toISOString();
      attendanceData.notes = `${tripType} attendance submitted by ${driverData.name}`;

      // Now save to the admin database
      const result = await AttendanceDB.saveAttendance(attendanceData);
      
      if (result.success) {
        setSubmitMessage(`✅ Attendance submitted successfully to admin dashboard!`);
        
        // Keep the data in localStorage but mark it as submitted
        const submittedData = JSON.parse(localStorage.getItem(localKey));
        submittedData.status = 'submitted';
        submittedData.submissionTime = new Date().toISOString();
        localStorage.setItem(localKey, JSON.stringify(submittedData));
        
        // Don't clear attendance marks - keep them visible for driver reference
        // This way driver can see what they submitted even after logout/login
        
        // Update locally saved counts (they should remain the same)
        updateLocallySavedCounts();
        
        // Update existing records
        setExistingRecords(prev => ({
          ...prev,
          [tripType]: result.data
        }));
      } else {
        setSubmitMessage(`❌ Error submitting attendance: ${result.error}`);
      }
    } catch (error) {
      setSubmitMessage(`❌ Error submitting attendance: ${error.message}`);
    } finally {
      setIsCompletingAttendance(false);
    }
  };

  // Check if current trip attendance has already been submitted
  const isCurrentAttendanceSubmitted = () => {
    const today = new Date().toISOString().split('T')[0];
    const localKey = `attendance_${driverData?.busId}_${tripType}_${today}`;
    const localData = localStorage.getItem(localKey);
    
    if (localData) {
      const savedAttendance = JSON.parse(localData);
      return savedAttendance.status === 'submitted';
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('userType');
    localStorage.removeItem('driverData');
    navigate('/');
  };

  const getPresentStudents = () => {
    return Object.entries(attendance)
      .filter(([_, isPresent]) => isPresent)
      .map(([rollNo, _]) => {
        const student = students.find(s => s.rollNo === rollNo);
        return {
          rollNo: rollNo,
          name: student?.name || '',
          email: student?.email || ''
        };
      });
  };

  const getAbsentStudents = () => {
    return Object.entries(attendance)
      .filter(([_, isPresent]) => !isPresent)
      .map(([rollNo, _]) => {
        const student = students.find(s => s.rollNo === rollNo);
        return {
          rollNo: rollNo,
          name: student?.name || '',
          email: student?.email || ''
        };
      });
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
          backgroundImage: 'url("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
        }}
      ></div>
      <div className="fixed inset-0 bg-gradient-to-br from-green-900/80 via-emerald-800/70 to-green-700/80"></div>
      
      {/* Header */}
      <div className="relative bg-white/95 backdrop-blur-lg shadow-2xl border-b-4 border-gradient-to-r from-green-500 to-emerald-500">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center">
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
        {/* Trip Type Selection */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-8 border border-white/20 card-hover">
          <h2 className="text-xl font-bold mb-4 gradient-text-green flex items-center">
            🚌 <span className="ml-3">Select Trip Type</span>
          </h2>
          
          <div className="flex space-x-4">
            <button
              onClick={() => handleTripTypeChange('home-to-campus')}
              className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 ${
                tripType === 'home-to-campus'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl transform scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              🏠➡️🏫 Home to Campus
              {locallySavedCounts['home-to-campus'] > 0 && (
                <div className="text-xs mt-1 opacity-80">
                  💾 {locallySavedCounts['home-to-campus']} students saved locally
                </div>
              )}
            </button>
            
            <button
              onClick={() => handleTripTypeChange('campus-to-home')}
              className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-300 ${
                tripType === 'campus-to-home'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl transform scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              🏫➡️🏠 Campus to Home
              {locallySavedCounts['campus-to-home'] > 0 && (
                <div className="text-xs mt-1 opacity-80">
                  💾 {locallySavedCounts['campus-to-home']} students saved locally
                </div>
              )}
            </button>
          </div>
        </div>

        {/* GPS Location Tracking Card */}
        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-8 border border-white/20 card-hover">
          <h2 className="text-xl font-bold mb-4 gradient-text-green flex items-center">
            📍 <span className="ml-3">GPS Location Tracking</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tracking Status */}
            <div className={`p-4 rounded-xl border-2 ${
              isTrackingLocation 
                ? 'bg-green-50 border-green-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-800">📡 Tracking Status</h3>
                <div className={`w-3 h-3 rounded-full ${
                  isTrackingLocation ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
              </div>
              <p className={`text-sm ${
                isTrackingLocation ? 'text-green-700' : 'text-red-700'
              }`}>
                {isTrackingLocation ? '✅ GPS tracking active' : '❌ GPS not tracking'}
              </p>
              {locationError && (
                <p className="text-xs text-red-600 mt-1">{locationError}</p>
              )}
            </div>

            {/* Current Location */}
            <div className="p-4 rounded-xl border-2 bg-blue-50 border-blue-300">
              <h3 className="text-lg font-bold text-gray-800 mb-2">🌐 Current Location</h3>
              {currentLocation ? (
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Lat:</strong> {currentLocation.lat.toFixed(6)}</p>
                  <p><strong>Lng:</strong> {currentLocation.lng.toFixed(6)}</p>
                  <p><strong>Speed:</strong> {currentLocation.speed ? `${Math.round(currentLocation.speed * 3.6)} km/h` : 'N/A'}</p>
                  <p><strong>Updated:</strong> {new Date(currentLocation.timestamp).toLocaleTimeString()}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Waiting for GPS signal...</p>
              )}
            </div>
          </div>

          {/* Location Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">📢 Info:</span> Your location is being shared with admin and students in real-time for bus tracking.
            </p>
          </div>
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white/20 card-hover">
          <h2 className="text-2xl font-bold mb-6 gradient-text-green flex items-center">
            📋 <span className="ml-3">Take Attendance - {tripType === 'home-to-campus' ? 'Home to Campus' : 'Campus to Home'}</span>
          </h2>
          <p className="text-gray-600 mb-6 text-lg">
            Mark students as present for {tripType === 'home-to-campus' ? 'morning' : 'evening'} journey
          </p>

          {/* Attendance Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-blue-800">Attendance Summary</h3>
              <button
                onClick={() => setShowPresentList(!showPresentList)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <span>👥</span>
                <span>{showPresentList ? 'Hide' : 'View'} Present Students</span>
                <svg className={`w-4 h-4 transform transition-transform ${showPresentList ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{getPresentStudents().length}</div>
                <div className="text-sm text-green-500">Present</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{getAbsentStudents().length}</div>
                <div className="text-sm text-red-500">Absent</div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {getPresentStudents().length > 0 ? Math.round((getPresentStudents().length / students.length) * 100) : 0}%
                </div>
                <div className="text-sm text-blue-500">Attendance Rate</div>
              </div>
            </div>

            {/* Present Students List */}
            {showPresentList && getPresentStudents().length > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-bold text-green-800 mb-3">Present Students ({getPresentStudents().length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {getPresentStudents().map((student, index) => (
                    <div key={index} className="bg-white p-2 rounded border border-green-200 text-sm">
                      <span className="font-medium text-green-700">{student.name}</span>
                      <span className="text-green-600 ml-2">({student.rollNo})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Student List */}
          <div className="space-y-4">
            {students.map((student) => (
              <div key={student.rollNo} className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                attendance[student.rollNo] 
                  ? 'bg-green-50 border-green-300 shadow-lg transform scale-105' 
                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center justify-between">
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

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Save Attendance Button */}
            <button
              onClick={saveAttendanceLocally}
              disabled={isSubmitting}
              className={`py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 transform hover:scale-105 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-xl'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  Saving...
                </div>
              ) : (
                `💾 Save ${tripType === 'home-to-campus' ? 'Morning' : 'Evening'} Attendance`
              )}
            </button>

            {/* Submit to Admin Button */}
            <button
              onClick={submitAttendanceToAdmin}
              disabled={isCompletingAttendance || getPresentStudents().length === 0 || isCurrentAttendanceSubmitted()}
              className={`py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 transform hover:scale-105 ${
                isCompletingAttendance || getPresentStudents().length === 0 || isCurrentAttendanceSubmitted()
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl'
              }`}
            >
              {isCompletingAttendance ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  Submitting...
                </div>
              ) : isCurrentAttendanceSubmitted() ? (
                `✅ Already Submitted to Admin`
              ) : (
                `📤 Submit to Admin Dashboard`
              )}
            </button>
          </div>

          {/* Completion Status */}
          {getPresentStudents().length === 0 && !isCurrentAttendanceSubmitted() && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
              ⚠️ Please mark at least one student as present before submitting
            </div>
          )}
          
          {isCurrentAttendanceSubmitted() && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg">
              ✅ This {tripType === 'home-to-campus' ? 'morning' : 'evening'} attendance has been successfully submitted to admin
            </div>
          )}
        </div>
      </div>

      <style>
        {`
        .gradient-text-green {
          background: linear-gradient(135deg, #10b981, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .btn-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        `}
      </style>
    </div>
  );
}
