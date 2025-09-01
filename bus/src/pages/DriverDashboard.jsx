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
  const [tripType, setTripType] = useState('home-to-campus');
  const [existingRecords, setExistingRecords] = useState({
    'home-to-campus': null,
    'campus-to-home': null
  });
  const [showPresentList, setShowPresentList] = useState(false);
  const [isCompletingAttendance, setIsCompletingAttendance] = useState(false);

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
      })
      .catch(err => console.error('Error loading student data:', err));
  }, []);

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

  const handleTripTypeChange = (newTripType) => {
    setTripType(newTripType);
    
    // Load attendance for the selected trip type
    if (existingRecords[newTripType]) {
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
        tripType: tripType,
        presentStudents: presentStudents,
        absentStudents: absentStudents,
        totalStudents: students.length,
        route: driverData.busId === '66d0123456a1b2c3d4e5f601' ? 'Route A - City Center to College' : 'Route B - Airport to College',
        notes: `${tripType} attendance taken by ${driverData.name}`
      };

      const result = await AttendanceDB.saveAttendance(attendanceData);
      
      if (result.success) {
        const action = existingRecords[tripType] ? 'updated' : 'submitted';
        setSubmitMessage(`✅ Attendance ${action} successfully for ${tripType}!`);
        
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

  const completeAttendanceSubmission = async () => {
    setIsCompletingAttendance(true);
    setSubmitMessage('');

    try {
      const result = await submitAttendance();
      if (result !== false) {
        setSubmitMessage(`✅ Attendance completed and submitted for ${tripType}!`);
        setShowPresentList(false);
      }
    } catch (error) {
      setSubmitMessage(`❌ Error completing attendance: ${error.message}`);
    } finally {
      setIsCompletingAttendance(false);
    }
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
              {existingRecords['home-to-campus'] && (
                <div className="text-xs mt-1 opacity-80">
                  ✅ Already submitted ({existingRecords['home-to-campus'].presentStudents.length} present)
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
              {existingRecords['campus-to-home'] && (
                <div className="text-xs mt-1 opacity-80">
                  ✅ Already submitted ({existingRecords['campus-to-home'].presentStudents.length} present)
                </div>
              )}
            </button>
          </div>
        </div>

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
            📋 <span className="ml-3">Take Attendance - {tripType === 'home-to-campus' ? 'Home to Campus' : 'Campus to Home'}</span>
          </h2>
          <p className="text-gray-600 mb-6 text-lg">
            {existingRecords[tripType] 
              ? 'Update attendance for this trip (already submitted)' 
              : `Mark students as present for ${tripType === 'home-to-campus' ? 'morning' : 'evening'} journey`}
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
                  {students.length > 0 ? Math.round((getPresentStudents().length / students.length) * 100) : 0}%
                </div>
                <div className="text-sm text-blue-500">Rate</div>
              </div>
            </div>

            {/* Present Students List - Expandable */}
            {showPresentList && (
              <div className="mt-6 border-t border-blue-200 pt-4">
                <h4 className="font-bold text-green-800 mb-3 flex items-center">
                  ✅ Present Students ({getPresentStudents().length})
                </h4>
                {getPresentStudents().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {getPresentStudents().map((student, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-green-800">{student.name}</p>
                          <p className="text-xs text-green-600">{student.rollNo}</p>
                        </div>
                        <div className="text-green-500 text-lg">✅</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No students marked as present</p>
                )}
              </div>
            )}
          </div>
          
          {/* Students List for Attendance */}
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

          {/* Action Buttons */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Save Draft Button */}
            <button
              onClick={submitAttendance}
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

            {/* Complete Submission Button */}
            <button
              onClick={completeAttendanceSubmission}
              disabled={isCompletingAttendance || getPresentStudents().length === 0}
              className={`py-4 rounded-2xl font-bold text-white text-lg transition-all duration-300 transform hover:scale-105 ${
                isCompletingAttendance || getPresentStudents().length === 0
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-xl'
              }`}
            >
              {isCompletingAttendance ? (
                <div className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  Completing...
                </div>
              ) : (
                `📤 Complete & Submit Attendance`
              )}
            </button>
          </div>

          {/* Completion Status */}
          {getPresentStudents().length === 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
              ⚠️ Please mark at least one student as present before completing submission
            </div>
          )}
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
