import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('buses');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

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

  useEffect(() => {
    fetch('/student.json')
      .then(response => response.json())
      .then(data => setStudents(data))
      .catch(err => console.error('Error loading student data:', err));
  }, []);

  const getStudentsByBus = (busId) => {
    return students.filter(student => student.bus.$oid === busId);
  };

  const handleLogout = () => {
    localStorage.removeItem('userType');
    navigate('/');
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
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
