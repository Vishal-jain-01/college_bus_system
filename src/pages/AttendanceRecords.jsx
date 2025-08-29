import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttendanceDB } from '../utils/attendanceDB.js';

export default function AttendanceRecords() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRecord, setExpandedRecord] = useState(null);
  const [filter, setFilter] = useState({
    date: '',
    driverId: '',
    busId: ''
  });
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadAttendanceData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, filter]);

  const loadAttendanceData = async () => {
    try {
      const data = await AttendanceDB.getAttendanceRecords();
      const statsData = await AttendanceDB.getAttendanceStats();
      
      setRecords(data.attendanceRecords);
      setStats(statsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = records;

    if (filter.date) {
      filtered = filtered.filter(record => record.date === filter.date);
    }
    if (filter.driverId) {
      filtered = filtered.filter(record => record.driverId.toLowerCase().includes(filter.driverId.toLowerCase()));
    }
    if (filter.busId) {
      filtered = filtered.filter(record => record.busId.toLowerCase().includes(filter.busId.toLowerCase()));
    }

    setFilteredRecords(filtered);
  };

  const toggleRecordExpansion = (recordId) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  const handleDeleteRecord = async (recordId) => {
    if (window.confirm('Are you sure you want to delete this attendance record?')) {
      const result = await AttendanceDB.deleteAttendanceRecord(recordId);
      if (result.success) {
        loadAttendanceData(); // Reload data
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
        <span className="ml-3">Loading attendance records...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
        }}
      ></div>
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/80 via-blue-800/70 to-indigo-900/80"></div>

      {/* Header */}
      <div className="relative bg-white/95 backdrop-blur-lg shadow-2xl border-b-4 border-purple-500">
        <div className="px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center">
                📊 <span className="ml-3">Attendance Database</span>
              </h1>
              <p className="text-gray-600 mt-2 text-lg">View and manage attendance records</p>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-xl"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="relative p-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20">
              <h3 className="text-lg font-semibold text-gray-700">Total Records</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.totalRecords}</p>
            </div>
            <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20">
              <h3 className="text-lg font-semibold text-gray-700">Active Drivers</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.uniqueDrivers}</p>
            </div>
            <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20">
              <h3 className="text-lg font-semibold text-gray-700">Active Buses</h3>
              <p className="text-3xl font-bold text-green-600">{stats.uniqueBuses}</p>
            </div>
            <div className="bg-white/95 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-white/20">
              <h3 className="text-lg font-semibold text-gray-700">Avg. Attendance</h3>
              <p className="text-3xl font-bold text-orange-600">{Math.round(stats.averageAttendance)}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-white/20">
          <h3 className="text-xl font-bold mb-4">Filter Records</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter({...filter, date: e.target.value})}
              className="px-4 py-2 border rounded-lg"
              placeholder="Filter by date"
            />
            <input
              type="text"
              value={filter.driverId}
              onChange={(e) => setFilter({...filter, driverId: e.target.value})}
              className="px-4 py-2 border rounded-lg"
              placeholder="Filter by Driver ID"
            />
            <input
              type="text"
              value={filter.busId}
              onChange={(e) => setFilter({...filter, busId: e.target.value})}
              className="px-4 py-2 border rounded-lg"
              placeholder="Filter by Bus ID"
            />
          </div>
        </div>

        {/* Records Table */}
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl overflow-hidden border border-white/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Date & Time</th>
                  <th className="px-6 py-4 text-left">Driver</th>
                  <th className="px-6 py-4 text-left">Bus ID</th>
                  <th className="px-6 py-4 text-left">Present</th>
                  <th className="px-6 py-4 text-left">Absent</th>
                  <th className="px-6 py-4 text-left">Total</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record, index) => (
                  <>
                    <tr key={record.id} className={`border-t ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors`}>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{record.date}</p>
                          <p className="text-sm text-gray-600">{record.time}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold">{record.driverName}</p>
                          <p className="text-sm text-gray-600">{record.driverId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{record.busId}</td>
                      <td className="px-6 py-4">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {record.presentStudents.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {record.absentStudents.length}
                        </span>
                      </td>
                      <td className="px-6 py-4">{record.totalStudents}</td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleRecordExpansion(record.id)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors text-sm"
                          >
                            {expandedRecord === record.id ? 'Hide Details' : 'View Details'}
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(record.id)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Details Row */}
                    {expandedRecord === record.id && (
                      <tr className="bg-blue-50 border-t">
                        <td colSpan="7" className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Present Students */}
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <h4 className="text-lg font-bold text-green-800 mb-3 flex items-center">
                                ✅ Present Students ({record.presentStudents.length})
                              </h4>
                              {record.presentStudents.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {record.presentStudents.map((student, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                                      <div>
                                        <p className="font-semibold text-green-800">{student.name}</p>
                                        <p className="text-sm text-green-600">{student.rollNo}</p>
                                      </div>
                                      <div className="text-green-500 text-xl">✅</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">No students present</p>
                              )}
                            </div>

                            {/* Absent Students */}
                            <div className="bg-white rounded-lg p-4 border border-red-200">
                              <h4 className="text-lg font-bold text-red-800 mb-3 flex items-center">
                                ❌ Absent Students ({record.absentStudents.length})
                              </h4>
                              {record.absentStudents.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {record.absentStudents.map((student, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                      <div>
                                        <p className="font-semibold text-red-800">{student.name}</p>
                                        <p className="text-sm text-red-600">{student.rollNo}</p>
                                      </div>
                                      <div className="text-red-500 text-xl">❌</div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">All students present</p>
                              )}
                            </div>
                          </div>

                          {/* Additional Record Info */}
                          <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="font-semibold text-gray-700">Route:</span>
                                <p className="text-gray-600">{record.route}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">Timestamp:</span>
                                <p className="text-gray-600">{new Date(record.timestamp).toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-700">Attendance Rate:</span>
                                <p className="text-gray-600">{Math.round((record.presentStudents.length / record.totalStudents) * 100)}%</p>
                              </div>
                            </div>
                            {record.notes && (
                              <div className="mt-3">
                                <span className="font-semibold text-gray-700">Notes:</span>
                                <p className="text-gray-600">{record.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-xl">No attendance records found</p>
          </div>
        )}
      </div>
    </div>
  );
}
