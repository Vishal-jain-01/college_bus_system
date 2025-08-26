// pages/RoleSelection.js
import { useNavigate } from "react-router-dom";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Bus Tracking System</h1>
      <div className="space-y-4">
        <button 
          onClick={() => navigate("/login/student")} 
          className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600"
        >
          Student
        </button>
        <button 
          onClick={() => navigate("/login/driver")} 
          className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600"
        >
          Driver
        </button>
        <button 
          onClick={() => navigate("/login/admin")} 
          className="px-6 py-3 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600"
        >
          Admin
        </button>
      </div>
    </div>
  );
}