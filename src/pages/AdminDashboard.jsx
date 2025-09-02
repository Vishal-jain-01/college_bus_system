import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleMaps } from '../hooks/useGoogleMaps.js';
import { AttendanceDB } from '../utils/attendanceDB.js';
import { LocationService } from '../utils/locationService.js';
import GoogleMap from '../components/GoogleMap.jsx';
import { 
  exportTodayAttendance, 
  exportAllAttendance, 
  exportDateRangeAttendance,
  ExcelExportService 
} from '../utils/excelExport.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isLoaded: isGoogleMapsLoaded } = useGoogleMaps('AIzaSyDRrEGi2nzH-3W2qqhOCFzZuRms5tGeYvI');
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('buses');
  const [searchTerm, setSearchTerm] = useState('');
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [realTimeLocations, setRealTimeLocations] = useState([]);
  const [expandedAttendanceRecord, setExpandedAttendanceRecord] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const buses = [
    {
      id: '66d0123456a1b2c3d4e5f601',
      busNumber: 'BUS-001',
      route: 'Route A - City Center to College',
      driver: 'Rajesh Kumar',
      capacity: 40,
      status: 'Active',
      currentLocation: { lat: 28.6139, lng: 77.2090, address: 'Connaught Place, Delhi' }
    },
    {
      id: '66d0123456a1b2c3d4e5f602',
      busNumber: 'BUS-002', 
      route: 'Route B - Airport to College',
      driver: 'Suresh Singh',
      capacity: 35,
      status: 'Active',
      currentLocation: { lat: 28.5562, lng: 77.1000, address: 'IGI Airport, Delhi' }
    }
  ];

  // Load real-time GPS locations function
  const loadRealTimeLocations = async () => {
    try {
      console.log('🔄 Loading real-time locations for admin dashboard...');
      const locations = await LocationService.getAllRealLocations();
      console.log('📍 Real GPS locations loaded for admin:', locations);
      setRealTimeLocations(locations);
    } catch (error) {
      console.error('❌ Error loading real-time locations:', error);
    }
  };

  useEffect(() => {
    fetch('/student.json')
      .then(response => response.json())
      .then(data => setStudents(data))
      .catch(err => console.error('Error loading student data:', err));
    
    loadTodayAttendance();

    // Load real-time GPS locations every 5 seconds
    loadRealTimeLocations();
    const locationInterval = setInterval(loadRealTimeLocations, 5000);

    return () => {
      clearInterval(locationInterval);
    };
  }, []);

  const loadTodayAttendance = async () => {
    try {
      console.log('Loading today attendance...');
      const today = new Date().toISOString().split('T')[0];
      console.log('Today date:', today);
      
      const todayRecords = await AttendanceDB.getAttendanceByDate(today);
      console.log('Today records:', todayRecords);
      
      setTodayAttendance(todayRecords);
    } catch (error) {
      console.error('Error loading today attendance:', error);
    }
  };

  const getStudentsByBus = (busId) => {
    return students.filter(student => student.bus.$oid === busId);
  };

  const handleLogout = () => {
    localStorage.removeItem('userType');
    navigate('/');
  };

  const toggleAttendanceExpansion = (recordId) => {
    setExpandedAttendanceRecord(expandedAttendanceRecord === recordId ? null : recordId);
  };

  // Excel Export Functions
  const handleExportTodayAttendance = async () => {
    setExportLoading(true);
    setExportMessage('');
    
    try {
      const result = await ExcelExportService.exportTodayAttendance();
      if (result.success) {
        setExportMessage(`✅ Today's attendance exported successfully! File: ${result.filename} (${result.recordCount} records)`);
      } else {
        setExportMessage(`❌ Export failed: ${result.error}`);
      }
    } catch (error) {
      setExportMessage(`❌ Export error: ${error.message}`);
    } finally {
      setExportLoading(false);
      setTimeout(() => setExportMessage(''), 5000);
    }
  };

  const handleExportAllAttendance = async () => {
    setExportLoading(true);
    setExportMessage('');
    
    try {
      const result = await ExcelExportService.exportAllAttendance();
      if (result.success) {
        setExportMessage(`✅ All attendance records exported successfully! File: ${result.filename} (${result.recordCount} records)`);
      } else {
        setExportMessage(`❌ Export failed: ${result.error}`);
      }
    } catch (error) {
      setExportMessage(`❌ Export error: ${error.message}`);
    } finally {
      setExportLoading(false);
      setTimeout(() => setExportMessage(''), 5000);
    }
  };

  const handleExportDateRange = async () => {
    setExportLoading(true);
    setExportMessage('');
    
    try {
      const result = await ExcelExportService.exportDateRangeAttendance(dateRange.startDate, dateRange.endDate);
      if (result.success) {
        setExportMessage(`✅ Date range attendance exported successfully! File: ${result.filename} (${result.recordCount} records)`);
      } else {
        setExportMessage(`❌ Export failed: ${result.error}`);
      }
    } catch (error) {
      setExportMessage(`❌ Export error: ${error.message}`);
    } finally {
      setExportLoading(false);
      setTimeout(() => setExportMessage(''), 5000);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStudents = students.length;
  const activeBuses = buses.filter(bus => bus.status === 'Active').length;

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
        }}
      ></div>
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-800/70 to-purple-900/80"></div>
      
      {/* Header */}
      <div className="relative bg-white/95 backdrop-blur-lg shadow-2xl border-b-4 border-gradient-to-r from-blue-500 to-purple-500">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                🚌 <span className="ml-3">Admin Dashboard</span>
              </h1>
              <p className="text-gray-600 mt-2 text-lg">College Bus Tracking System</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl hover:from-red-600 hover:to-red-700 transform hover:scale-110 transition-all duration-300 shadow-xl flex items-center space-x-2"
            >
              <span>🚪</span>
              <span className="font-semibold">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="relative p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-8 rounded-3xl shadow-2xl transform hover:scale-110 hover:rotate-1 transition-all duration-300 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Active Buses</h3>
                <p className="text-4xl font-bold">{activeBuses}</p>
              </div>
              <div className="text-6xl opacity-80">🚌</div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm opacity-90">All systems operational</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 text-white p-8 rounded-3xl shadow-2xl transform hover:scale-110 hover:rotate-1 transition-all duration-300 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Total Students</h3>
                <p className="text-4xl font-bold">{totalStudents}</p>
              </div>
              <div className="text-6xl opacity-80">👥</div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm opacity-90">Registered & active</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 text-white p-8 rounded-3xl shadow-2xl transform hover:scale-110 hover:rotate-1 transition-all duration-300 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Live Tracking</h3>
                <p className="text-2xl font-bold">Real-time</p>
              </div>
              <div className="text-6xl opacity-80">📍</div>
            </div>
            <div className="mt-4 flex items-center">
              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm opacity-90">GPS enabled</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-10">
          <div className="flex space-x-3 bg-white/95 backdrop-blur-lg p-3 rounded-2xl shadow-2xl border border-white/20">
            <button
              onClick={() => setActiveTab('buses')}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center space-x-3 ${
                activeTab === 'buses' 
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl transform scale-105' 
                  : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <span className="text-2xl">🚌</span>
              <span>Bus Management</span>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center space-x-3 ${
                activeTab === 'students' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl transform scale-105' 
                  : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              <span className="text-2xl">👥</span>
              <span>Student Directory</span>
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center space-x-3 ${
                activeTab === 'attendance' 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl transform scale-105' 
                  : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
              }`}
            >
              <span className="text-2xl">📋</span>
              <span>Today's Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab('locations')}
              className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center space-x-3 ${
                activeTab === 'locations' 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl transform scale-105' 
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              <span className="text-2xl">📍</span>
              <span>Real-Time Locations</span>
            </button>
          </div>
        </div>

        {/* Bus Details Tab */}
        {activeTab === 'buses' && (
          <div className="space-y-8 animate-fadeIn">
            {buses.map(bus => (
              <div key={bus.id} className="bg-white/95 backdrop-blur-lg p-10 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 border border-white/20 transform hover:scale-105">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                    🚌 <span className="ml-3">{bus.busNumber}</span>
                    <span className="ml-4 px-4 py-2 bg-green-100 text-green-800 text-lg rounded-full border border-green-200">
                      {bus.status}
                    </span>
                  </h3>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-lg font-semibold text-gray-600">Live Tracking</span>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-500">🛣️</span>
                      <span><strong>Route:</strong> {bus.route}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-green-500">👨‍💼</span>
                      <span><strong>Driver:</strong> {bus.driver}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-purple-500">🎯</span>
                      <span><strong>Capacity:</strong> {bus.capacity} students</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-red-500">📍</span>
                      <span><strong>Location:</strong> {bus.currentLocation.address}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-bold mb-3 flex items-center">
                      👥 Students in this bus ({getStudentsByBus(bus.id).length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {getStudentsByBus(bus.id).map(student => (
                        <div key={student.rollNo} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{student.name}</span>
                            <span className="text-sm text-gray-500">{student.rollNo}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              <div className="p-8 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                  👥 <span className="ml-3">Student Directory</span>
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search students by name, roll no, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-6 py-4 pl-14 rounded-2xl border-2 border-white/20 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-white/50 focus:border-white transition-all duration-300 text-lg"
                  />
                  <span className="absolute left-5 top-4 text-2xl text-gray-400">🔍</span>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Info</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bus Assignment</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student, index) => (
                      <tr key={student.rollNo} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                {student.name.charAt(0)}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              <div className="text-sm text-gray-500">{student.rollNo}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {student.bus.$oid.slice(-3)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Today's Attendance Tab */}
        {activeTab === 'attendance' && (
          <div className="animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              <div className="p-8 bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                      📋 <span className="ml-3">Today's Attendance Summary</span>
                    </h2>
                    <p className="text-purple-100 text-lg">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })} - Both Trips
                    </p>
                  </div>
                  
                  {/* Excel Export Section */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <h3 className="text-white font-bold mb-3 flex items-center">
                      📄 <span className="ml-2">Export to Excel</span>
                    </h3>
                    
                    <div className="space-y-2">
                      <button
                        onClick={handleExportTodayAttendance}
                        disabled={exportLoading || todayAttendance.length === 0}
                        className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {exportLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Exporting...</span>
                          </>
                        ) : (
                          <>
                            <span>📅</span>
                            <span>Export Today ({todayAttendance.length} records)</span>
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={handleExportAllAttendance}
                        disabled={exportLoading}
                        className="w-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {exportLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Exporting...</span>
                          </>
                        ) : (
                          <>
                            <span>🗂️</span>
                            <span>Export All Records</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Export Message */}
                {exportMessage && (
                  <div className={`mt-4 p-3 rounded-lg border ${
                    exportMessage.includes('✅') 
                      ? 'bg-green-100/20 border-green-300/30 text-green-100' 
                      : 'bg-red-100/20 border-red-300/30 text-red-100'
                  }`}>
                    {exportMessage}
                  </div>
                )}
              </div>
              
              {/* Date Range Export Section */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  📊 <span className="ml-2">Export Date Range</span>
                </h3>
                
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  
                  <div className="pt-6">
                    <button
                      onClick={handleExportDateRange}
                      disabled={exportLoading || !dateRange.startDate || !dateRange.endDate}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {exportLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Exporting...</span>
                        </>
                      ) : (
                        <>
                          <span>📈</span>
                          <span>Export Range</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {todayAttendance.length > 0 ? (
                  <div className="space-y-6">
                    {/* Group records by bus */}
                    {Object.entries(
                      todayAttendance.reduce((groups, record) => {
                        if (!groups[record.busId]) groups[record.busId] = [];
                        groups[record.busId].push(record);
                        return groups;
                      }, {})
                    ).map(([busId, records]) => (
                      <div key={busId} className="bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="p-6">
                          <h3 className="text-xl font-bold text-gray-800 mb-4">
                            Bus {busId.slice(-3)} - {records[0]?.driverName}
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Home to Campus Trip */}
                            {(() => {
                              const morningTrip = records.find(r => r.tripType === 'home-to-campus');
                              return (
                                <div 
                                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    morningTrip 
                                      ? 'border-blue-200 bg-blue-50 hover:bg-blue-100' 
                                      : 'border-gray-200 bg-gray-100'
                                  }`}
                                  onClick={() => morningTrip && toggleAttendanceExpansion(`${morningTrip.id}-morning`)}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-blue-800">🏠➡️🏫 Home to Campus</h4>
                                    {morningTrip && (
                                      <div className="text-blue-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {morningTrip ? (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-green-600">Present: {morningTrip.presentStudents.length}</span>
                                      <span className="text-red-600">Absent: {morningTrip.absentStudents.length}</span>
                                      <span className="text-blue-600">
                                        {Math.round((morningTrip.presentStudents.length / morningTrip.totalStudents) * 100)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-sm">Not submitted yet</p>
                                  )}
                                </div>
                              );
                            })()}

                            {/* Campus to Home Trip */}
                            {(() => {
                              const eveningTrip = records.find(r => r.tripType === 'campus-to-home');
                              return (
                                <div 
                                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                    eveningTrip 
                                      ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' 
                                      : 'border-gray-200 bg-gray-100'
                                  }`}
                                  onClick={() => eveningTrip && toggleAttendanceExpansion(`${eveningTrip.id}-evening`)}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-bold text-orange-800">🏫➡️🏠 Campus to Home</h4>
                                    {eveningTrip && (
                                      <div className="text-orange-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {eveningTrip ? (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-green-600">Present: {eveningTrip.presentStudents.length}</span>
                                      <span className="text-red-600">Absent: {eveningTrip.absentStudents.length}</span>
                                      <span className="text-orange-600">
                                        {Math.round((eveningTrip.presentStudents.length / eveningTrip.totalStudents) * 100)}%
                                      </span>
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-sm">Not submitted yet</p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Expanded Details for Morning Trip */}
                        {records.find(r => r.tripType === 'home-to-campus') && 
                         expandedAttendanceRecord === `${records.find(r => r.tripType === 'home-to-campus').id}-morning` && (
                          <div className="border-t border-gray-200 p-6 bg-blue-50">
                            {(() => {
                              const record = records.find(r => r.tripType === 'home-to-campus');
                              return (
                                <div>
                                  <h4 className="font-bold text-blue-800 mb-4">🏠➡️🏫 Home to Campus - Detailed Attendance</h4>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Present Students */}
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                      <h5 className="font-bold text-green-800 mb-3 flex items-center">
                                        ✅ Present Students ({record.presentStudents.length})
                                      </h5>
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {record.presentStudents.map((student, idx) => (
                                          <div key={idx} className="bg-white p-3 rounded border border-green-200 flex justify-between items-center">
                                            <div>
                                              <p className="font-medium text-green-800">{student.name}</p>
                                              <p className="text-sm text-green-600">{student.rollNo}</p>
                                            </div>
                                            <div className="text-green-500 text-xl">✅</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Absent Students */}
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                      <h5 className="font-bold text-red-800 mb-3 flex items-center">
                                        ❌ Absent Students ({record.absentStudents.length})
                                      </h5>
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {record.absentStudents.map((student, idx) => (
                                          <div key={idx} className="bg-white p-3 rounded border border-red-200 flex justify-between items-center">
                                            <div>
                                              <p className="font-medium text-red-800">{student.name}</p>
                                              <p className="text-sm text-red-600">{student.rollNo}</p>
                                            </div>
                                            <div className="text-red-500 text-xl">❌</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Trip Details */}
                                  <div className="mt-4 bg-blue-100 p-4 rounded-lg border border-blue-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="font-semibold text-blue-800">Time:</span>
                                        <p className="text-blue-600">{record.time}</p>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-blue-800">Driver:</span>
                                        <p className="text-blue-600">{record.driverName}</p>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-blue-800">Route:</span>
                                        <p className="text-blue-600">{record.route}</p>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-blue-800">Attendance Rate:</span>
                                        <p className="text-blue-600">{Math.round((record.presentStudents.length / record.totalStudents) * 100)}%</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Expanded Details for Evening Trip */}
                        {records.find(r => r.tripType === 'campus-to-home') && 
                         expandedAttendanceRecord === `${records.find(r => r.tripType === 'campus-to-home').id}-evening` && (
                          <div className="border-t border-gray-200 p-6 bg-orange-50">
                            {(() => {
                              const record = records.find(r => r.tripType === 'campus-to-home');
                              return (
                                <div>
                                  <h4 className="font-bold text-orange-800 mb-4">🏫➡️🏠 Campus to Home - Detailed Attendance</h4>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Present Students */}
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                      <h5 className="font-bold text-green-800 mb-3 flex items-center">
                                        ✅ Present Students ({record.presentStudents.length})
                                      </h5>
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {record.presentStudents.map((student, idx) => (
                                          <div key={idx} className="bg-white p-3 rounded border border-green-200 flex justify-between items-center">
                                            <div>
                                              <p className="font-medium text-green-800">{student.name}</p>
                                              <p className="text-sm text-green-600">{student.rollNo}</p>
                                            </div>
                                            <div className="text-green-500 text-xl">✅</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Absent Students */}
                                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                      <h5 className="font-bold text-red-800 mb-3 flex items-center">
                                        ❌ Absent Students ({record.absentStudents.length})
                                      </h5>
                                      <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {record.absentStudents.map((student, idx) => (
                                          <div key={idx} className="bg-white p-3 rounded border border-red-200 flex justify-between items-center">
                                            <div>
                                              <p className="font-medium text-red-800">{student.name}</p>
                                              <p className="text-sm text-red-600">{student.rollNo}</p>
                                            </div>
                                            <div className="text-red-500 text-xl">❌</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Trip Details */}
                                  <div className="mt-4 bg-orange-100 p-4 rounded-lg border border-orange-200">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div>
                                        <span className="font-semibold text-orange-800">Time:</span>
                                        <p className="text-orange-600">{record.time}</p>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-orange-800">Driver:</span>
                                        <p className="text-orange-600">{record.driverName}</p>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-orange-800">Route:</span>
                                        <p className="text-orange-600">{record.route}</p>
                                      </div>
                                      <div>
                                        <span className="font-semibold text-orange-800">Attendance Rate:</span>
                                        <p className="text-orange-600">{Math.round((record.presentStudents.length / record.totalStudents) * 100)}%</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Attendance Records Today</h3>
                    <p className="text-gray-500">Drivers haven't submitted attendance yet today.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Locations Tab */}
        {activeTab === 'locations' && (
          <div className="animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              <div className="p-8 bg-gradient-to-r from-orange-500 via-orange-600 to-red-600">
                <h2 className="text-3xl font-bold text-white mb-4 flex items-center">
                  📍 <span className="ml-3">Real-Time GPS Locations</span>
                </h2>
                <p className="text-orange-100 text-lg">Live tracking from driver mobile phones</p>
                
                {/* Debug Button */}
                <button
                  onClick={async () => {
                    console.log('🔄 Manual location refresh triggered');
                    await loadRealTimeLocations();
                  }}
                  className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  🔄 Refresh Locations (Debug)
                </button>
              </div>
              
              <div className="p-6">
                {realTimeLocations.length > 0 ? (
                  <div className="space-y-8">
                    {realTimeLocations.map((location) => (
                      <div key={location.busId} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-gray-800">Bus {location.busId.slice(-3)}</h3>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                            <span className="text-green-600 font-semibold">Live GPS</span>
                          </div>
                        </div>

                        {/* Map View - Same as Student Dashboard */}
                        <div className="mb-6 h-64 rounded-xl overflow-hidden border border-gray-200">
                          <GoogleMap
                            busLocations={[{
                              id: location.busId,
                              lat: location.lat,
                              lng: location.lng,
                              busNumber: `BUS-${location.busId.slice(-3)}`,
                              driver: location.busId === '66d0123456a1b2c3d4e5f601' ? 'Rajesh Kumar' : 'Suresh Singh',
                              route: location.busId === '66d0123456a1b2c3d4e5f601' 
                                ? 'Route A - City Center to College'
                                : 'Route B - Airport to College',
                              speed: location.speed,
                              name: `Current Location`,
                              nextStop: 'Next Stop',
                              estimatedArrival: '5:30'
                            }]}
                            center={{ lat: location.lat, lng: location.lng }}
                            zoom={15}
                            isGoogleMapsAvailable={isGoogleMapsLoaded}
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

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-white p-3 rounded-lg">
                              <span className="font-semibold text-gray-700">Current Location</span>
                              <p className="text-purple-600 font-semibold">
                                {(() => {
                                  const busId = location.busId;
                                  try {
                                    // Use LocationService to get current stop name
                                    const currentStop = LocationService.getCurrentStop(location.lat, location.lng, busId);
                                    return currentStop || 'En Route';
                                  } catch (error) {
                                    // Fallback to generic location description
                                    return 'On Route';
                                  }
                                })()}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg">
                              <span className="font-semibold text-gray-700">Next Stop</span>
                              <p className="text-blue-600 font-semibold">
                                {(() => {
                                  const busId = location.busId;
                                  try {
                                    // Use LocationService to get next stop name
                                    const nextStop = LocationService.getNextStop(location.lat, location.lng, busId);
                                    return nextStop || 'Final Destination';
                                  } catch (error) {
                                    // Fallback to generic description
                                    return 'Unknown';
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-blue-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-gray-700">Last Update:</span>
                                <p className="text-gray-600">{new Date(location.timestamp).toLocaleString()}</p>
                              </div>
                              <button
                                onClick={() => window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, '_blank')}
                                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
                              >
                                <span>📍</span>
                                <span>View on Google Maps</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📍</div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Real-Time Locations</h3>
                    <p className="text-gray-500 mb-4">Drivers need to enable GPS tracking on their devices</p>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 max-w-md mx-auto">
                      <h4 className="font-semibold text-blue-800 mb-2">How to Enable GPS Tracking:</h4>
                      <ol className="text-sm text-blue-700 text-left space-y-1">
                        <li>1. Driver logs into their dashboard</li>
                        <li>2. Clicks "Start Tracking" button</li>
                        <li>3. Allows location permissions</li>
                        <li>4. Location appears here in real-time</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        `}
      </style>
    </div>
  );
}
