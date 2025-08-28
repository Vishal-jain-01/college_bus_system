import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DriverLogin() {
  const [credentials, setCredentials] = useState({ driverId: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const drivers = [
    { id: 'D001', name: 'Rajesh Kumar', password: 'driver123', busId: '66d0123456a1b2c3d4e5f601' },
    { id: 'D002', name: 'Suresh Singh', password: 'driver456', busId: '66d0123456a1b2c3d4e5f602' }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    const driver = drivers.find(d => d.id === credentials.driverId && d.password === credentials.password);
    
    if (driver) {
      localStorage.setItem('userType', 'driver');
      localStorage.setItem('driverData', JSON.stringify(driver));
      navigate('/driver/dashboard');
    } else {
      setError('Invalid driver credentials');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/80 via-emerald-800/70 to-green-700/80"></div>
      
      {/* Road animation effect */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-8 bg-white rounded-full opacity-30 animate-float"
            style={{
              left: `${20 + (i * 3)}%`,
              top: `${50 + Math.sin(i) * 20}%`,
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md transform hover:scale-105 transition-all duration-300 border border-white/20">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🚗</div>
          <h2 className="text-3xl font-bold gradient-text-green mb-2">Driver Portal</h2>
          <p className="text-gray-600">Manage routes and attendance</p>
          <div className="w-20 h-1 bg-gradient-to-r from-green-500 to-emerald-500 mx-auto mt-2 rounded-full"></div>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Driver ID</label>
            <input
              type="text"
              value={credentials.driverId}
              onChange={(e) => setCredentials({...credentials, driverId: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., D001"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600"
          >
            Login
          </button>
        </form>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl backdrop-blur-sm">
          <h3 className="font-semibold text-green-800 mb-2 flex items-center">
            🔑 <span className="ml-2">Test Credentials:</span>
          </h3>
          <div className="space-y-1 text-sm">
            <p className="flex items-center"><span className="font-medium">ID:</span> <code className="ml-2 bg-green-100 px-2 py-1 rounded">D001</code> <span className="ml-2">Password:</span> <code className="ml-1 bg-green-100 px-2 py-1 rounded">driver123</code></p>
            <p className="flex items-center"><span className="font-medium">ID:</span> <code className="ml-2 bg-green-100 px-2 py-1 rounded">D002</code> <span className="ml-2">Password:</span> <code className="ml-1 bg-green-100 px-2 py-1 rounded">driver456</code></p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg btn-hover"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}