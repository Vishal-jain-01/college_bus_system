// pages/RoleSelection.js
import { useNavigate } from "react-router-dom";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-800/70 to-purple-900/80"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-white rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent mb-4 animate-bounce">
            🚌 Bus Tracking System
          </h1>
          <p className="text-2xl text-white/90 mb-2">Real-time College Bus Management</p>
          <div className="w-72 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="flex flex-col gap-8">   
          <button 
            onClick={() => navigate("/login/student")} 
            className="group px-12 py-6 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white rounded-2xl shadow-2xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 transform hover:scale-110 hover:rotate-1 transition-all duration-300 border border-white/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-center space-x-4">
              <span className="text-3xl group-hover:animate-bounce">🎓</span>
              <span className="text-2xl font-bold">Student Portal</span>
            </div>
            <p className="text-blue-100 mt-2">Track your bus in real-time</p>
          </button>
          
          <button 
            onClick={() => navigate("/login/driver")} 
            className="group px-12 py-6 bg-gradient-to-r from-green-500 via-green-600 to-emerald-700 text-white rounded-2xl shadow-2xl hover:from-green-600 hover:via-green-700 hover:to-emerald-800 transform hover:scale-110 hover:rotate-1 transition-all duration-300 border border-white/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-center space-x-4">
              <span className="text-3xl group-hover:animate-bounce">🚗</span>
              <span className="text-2xl font-bold">Driver Portal</span>
            </div>
            <p className="text-green-100 mt-2">Manage attendance & routes</p>
          </button>
          
          <button 
            onClick={() => navigate("/login/admin")} 
            className="group px-12 py-6 bg-gradient-to-r from-red-500 via-red-600 to-pink-700 text-white rounded-2xl shadow-2xl hover:from-red-600 hover:via-red-700 hover:to-pink-800 transform hover:scale-110 hover:rotate-1 transition-all duration-300 border border-white/20 backdrop-blur-sm"
          >
            <div className="flex items-center justify-center space-x-4">
              <span className="text-3xl group-hover:animate-bounce">⚙️</span>
              <span className="text-2xl font-bold">Admin Portal</span>
            </div>
            <p className="text-red-100 mt-2">Complete system management</p>
          </button>
        </div>
        
        <div className="mt-12 text-white/70">
          <p className="text-lg">Secure • Reliable • Real-time</p>
        </div>
      </div>
    </div>
  );
}