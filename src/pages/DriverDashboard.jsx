import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttendanceDB } from '../utils/attendanceDB.js';
import { LocationService } from '../utils/locationService.js';
import { ExcelExportService } from '../utils/excelExport.js';
import swManager from '../utils/serviceWorkerManager.js';
import backgroundLocationService from '../utils/backgroundLocationService.js';

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
  const [isServiceWorkerActive, setIsServiceWorkerActive] = useState(false);
  const [backgroundTracking, setBackgroundTracking] = useState(false);
  const [isBackgroundServiceActive, setIsBackgroundServiceActive] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [isUltraAggressiveTracking, setIsUltraAggressiveTracking] = useState(false);

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
      .catch(err => {
        console.error('Error loading students:', err);
      });

    // Initialize Service Worker and background tracking
    initializeBackgroundTracking();

    // Check wake lock status periodically
    const wakeLockInterval = setInterval(() => {
      setWakeLockActive(backgroundLocationService.isWakeLockActive());
    }, 2000);

    return () => {
      clearInterval(wakeLockInterval);
    };
  }, []);

  const initializeBackgroundTracking = async () => {
    try {
      // Register Service Worker
      const swRegistration = await swManager.register();
      setIsServiceWorkerActive(!!swRegistration);
      
      // Start background location service
      await backgroundLocationService.startTracking();
      setIsBackgroundServiceActive(true);
      setIsUltraAggressiveTracking(true);
      
      console.log('🔥 Ultra-aggressive background tracking initialized');
    } catch (error) {
      console.error('Failed to initialize background tracking:', error);
      setLocationError('Failed to initialize background tracking');
    }
  };

  const loadTodayRecords = async (busId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check for existing records
      const homeToCampusRecord = await AttendanceDB.getAttendanceRecord(busId, today, 'home-to-campus');
      const campusToHomeRecord = await AttendanceDB.getAttendanceRecord(busId, today, 'campus-to-home');
      
      setExistingRecords({
        'home-to-campus': homeToCampusRecord,
        'campus-to-home': campusToHomeRecord
      });

      // Count locally saved records
      const localCounts = await AttendanceDB.getLocalRecordCounts(busId, today);
      setLocallySavedCounts(localCounts);
    } catch (error) {
      console.error('Error loading today records:', error);
    }
  };

  const handleAttendanceChange = (rollNo, isPresent) => {
    setAttendance(prev => ({
      ...prev,
      [rollNo]: isPresent
    }));
  };

  const markAllPresent = () => {
    const allPresentAttendance = {};
    students.forEach(student => {
      allPresentAttendance[student.rollNo] = true;
    });
    setAttendance(allPresentAttendance);
  };

  const markAllAbsent = () => {
    const allAbsentAttendance = {};
    students.forEach(student => {
      allAbsentAttendance[student.rollNo] = false;
    });
    setAttendance(allAbsentAttendance);
  };

  const getPresentStudents = () => {
    return students.filter(student => attendance[student.rollNo]);
  };

  const getAbsentStudents = () => {
    return students.filter(student => !attendance[student.rollNo]);
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          setCurrentLocation(location);
          resolve(location);
        },
        (error) => {
          setLocationError(`Location error: ${error.message}`);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const startLocationTracking = async () => {
    try {
      setIsTrackingLocation(true);
      setLocationError('');
      
      // Get initial location
      await getCurrentLocation();
      
      // Start ultra-aggressive background tracking
      await backgroundLocationService.startTracking();
      setBackgroundTracking(true);
      setIsBackgroundServiceActive(true);
      setIsUltraAggressiveTracking(true);
      
      console.log('🔥 Ultra-aggressive location tracking started');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setLocationError(error.message);
      setIsTrackingLocation(false);
    }
  };

  const stopLocationTracking = async () => {
    try {
      setIsTrackingLocation(false);
      setBackgroundTracking(false);
      
      // Stop background service
      await backgroundLocationService.stopTracking();
      setIsBackgroundServiceActive(false);
      setIsUltraAggressiveTracking(false);
      
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  };

  const completeAttendance = async () => {
    if (isCompletingAttendance) return;
    
    setIsCompletingAttendance(true);
    try {
      // Get current location
      let location = currentLocation;
      if (!location) {
        try {
          location = await getCurrentLocation();
        } catch (error) {
          console.warn('Could not get current location, using last known location');
        }
      }

      const presentStudents = getPresentStudents();
      const absentStudents = getAbsentStudents();
      
      const attendanceRecord = {
        busId: driverData.busId,
        driverName: driverData.name,
        date: new Date().toISOString().split('T')[0],
        tripType: tripType,
        presentStudents: presentStudents.map(s => ({
          rollNo: s.rollNo,
          name: s.name,
          phone: s.phone,
          route: s.route
        })),
        absentStudents: absentStudents.map(s => ({
          rollNo: s.rollNo,
          name: s.name,
          phone: s.phone,
          route: s.route
        })),
        totalPresent: presentStudents.length,
        totalAbsent: absentStudents.length,
        totalStudents: students.length,
        location: location,
        timestamp: Date.now(),
        isCompleted: true
      };

      // Save locally first
      await AttendanceDB.saveAttendanceRecord(attendanceRecord);
      
      // Try to submit to server
      try {
        await AttendanceDB.submitPendingRecords();
        setSubmitMessage(`✅ Attendance completed and submitted! Present: ${presentStudents.length}, Absent: ${absentStudents.length}`);
      } catch (submitError) {
        console.warn('Could not submit to server, saved locally:', submitError);
        setSubmitMessage(`💾 Attendance saved locally (will sync when online). Present: ${presentStudents.length}, Absent: ${absentStudents.length}`);
      }

      // Reload records to show updated status
      await loadTodayRecords(driverData.busId);
      
      // Reset form
      const initialAttendance = {};
      students.forEach(student => {
        initialAttendance[student.rollNo] = false;
      });
      setAttendance(initialAttendance);
      
    } catch (error) {
      console.error('Error completing attendance:', error);
      setSubmitMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsCompletingAttendance(false);
    }
  };

  const exportToExcel = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = await AttendanceDB.getAttendanceRecordsByDate(today);
      
      if (records.length === 0) {
        alert('No attendance records found for today');
        return;
      }

      await ExcelExportService.exportAttendanceRecords(records, today);
      alert('Attendance exported to Excel successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel: ' + error.message);
    }
  };

  const syncPendingRecords = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const result = await AttendanceDB.submitPendingRecords();
      if (result.submitted > 0) {
        setSubmitMessage(`✅ Synced ${result.submitted} records to server`);
        await loadTodayRecords(driverData.busId);
      } else {
        setSubmitMessage('No pending records to sync');
      }
    } catch (error) {
      console.error('Error syncing records:', error);
      setSubmitMessage(`❌ Sync error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driverData');
    stopLocationTracking();
    navigate('/driver-login');
  };

  if (!driverData || !driverData.name) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading driver data...</p>
          <button 
            onClick={() => navigate('/driver-login')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Driver Dashboard</h1>
              <p className="text-gray-600">Welcome, {driverData.name}</p>
              <p className="text-sm text-gray-500">Bus ID: {driverData.busId}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>

          {/* Ultra-Aggressive Background Tracking Status */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-red-800">
                🔥 {isUltraAggressiveTracking 
                      ? 'ULTRA-AGGRESSIVE Background Tracking (Screen Off/App Switch)' 
                      : 'Ultra-aggressive tracking disabled'}
              </span>
            </div>
            {isUltraAggressiveTracking && (
              <p className="text-xs text-red-600 mt-1">
                Location tracking continues even when screen is off or using other apps
              </p>
            )}
          </div>

          {/* Background Tracking Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h3 className="font-semibold text-blue-800 mb-2">Background Services</h3>
              <div className="space-y-1 text-sm">
                <p className="flex justify-between">
                  <span>Service Worker:</span>
                  <span className={isServiceWorkerActive ? 'text-green-600' : 'text-red-600'}>
                    {isServiceWorkerActive ? '✅ Active' : '❌ Inactive'}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Background Service:</span>
                  <span className={isBackgroundServiceActive ? 'text-green-600' : 'text-red-600'}>
                    {isBackgroundServiceActive ? '✅ Running' : '❌ Stopped'}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Wake Lock:</span>
                  <span className={wakeLockActive ? 'text-green-600' : 'text-orange-600'}>
                    {wakeLockActive ? '🔒 Active' : '🔓 Released'}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h3 className="font-semibold text-green-800 mb-2">Location Tracking</h3>
              <div className="space-y-2">
                {!isTrackingLocation ? (
                  <button
                    onClick={startLocationTracking}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    🚀 Start Ultra-Aggressive Tracking
                  </button>
                ) : (
                  <button
                    onClick={stopLocationTracking}
                    className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                  >
                    ⏹️ Stop Tracking
                  </button>
                )}
                {currentLocation && (
                  <p className="text-xs text-green-600">
                    📍 Last: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </p>
                )}
                {locationError && (
                  <p className="text-xs text-red-600">⚠️ {locationError}</p>
                )}
              </div>
            </div>
          </div>

          {/* Trip Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Type:
            </label>
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-full"
            >
              <option value="home-to-campus">Home to Campus</option>
              <option value="campus-to-home">Campus to Home</option>
            </select>
          </div>

          {/* Today's Records Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h3 className="font-semibold text-blue-800">Today's Records</h3>
              <div className="text-sm mt-2">
                <p className="flex justify-between">
                  <span>Home to Campus:</span>
                  <span className={existingRecords['home-to-campus'] ? 'text-green-600' : 'text-gray-500'}>
                    {existingRecords['home-to-campus'] ? '✅ Completed' : '⏳ Pending'}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Campus to Home:</span>
                  <span className={existingRecords['campus-to-home'] ? 'text-green-600' : 'text-gray-500'}>
                    {existingRecords['campus-to-home'] ? '✅ Completed' : '⏳ Pending'}
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h3 className="font-semibold text-yellow-800">Local Records</h3>
              <div className="text-sm mt-2">
                <p>Home to Campus: {locallySavedCounts['home-to-campus']} saved</p>
                <p>Campus to Home: {locallySavedCounts['campus-to-home']} saved</p>
                <button
                  onClick={syncPendingRecords}
                  disabled={isSubmitting}
                  className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Syncing...' : '🔄 Sync to Server'}
                </button>
              </div>
            </div>
          </div>

          {submitMessage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">{submitMessage}</p>
            </div>
          )}
        </div>

        {/* Attendance Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Student Attendance ({tripType})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Mark All Present
              </button>
              <button
                onClick={markAllAbsent}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{students.length}</p>
              <p className="text-sm text-gray-600">Total Students</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
              <p className="text-sm text-gray-600">Present</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{absentCount}</p>
              <p className="text-sm text-gray-600">Absent</p>
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-2 mb-6">
            {students.map((student) => (
              <div
                key={student.rollNo}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  attendance[student.rollNo] 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-gray-600">
                    Roll: {student.rollNo} | Route: {student.route} | Phone: {student.phone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAttendanceChange(student.rollNo, true)}
                    className={`px-4 py-2 rounded ${
                      attendance[student.rollNo]
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    onClick={() => handleAttendanceChange(student.rollNo, false)}
                    className={`px-4 py-2 rounded ${
                      !attendance[student.rollNo]
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={completeAttendance}
              disabled={isCompletingAttendance || students.length === 0}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1"
            >
              {isCompletingAttendance ? (
                <>⏳ Completing Attendance...</>
              ) : (
                <>✅ Complete Attendance ({tripType})</>
              )}
            </button>
            <button
              onClick={() => setShowPresentList(!showPresentList)}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
            >
              {showPresentList ? 'Hide' : 'Show'} Present List
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              📊 Export Excel
            </button>
          </div>
        </div>

        {/* Present Students List */}
        {showPresentList && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Present Students ({presentCount})
            </h3>
            {getPresentStudents().length > 0 ? (
              <div className="space-y-2">
                {getPresentStudents().map((student) => (
                  <div key={student.rollNo} className="flex justify-between items-center p-2 bg-green-50 border border-green-200 rounded">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">Roll: {student.rollNo} | Route: {student.route}</p>
                    </div>
                    <span className="text-green-600 font-medium">✅ Present</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No students marked as present</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
