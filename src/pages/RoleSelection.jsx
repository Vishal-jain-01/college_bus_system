// // pages/RoleSelection.js
// import { useNavigate } from "react-router-dom";

// export default function RoleSelection() {
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex flex-col">
//       {/* Header / Branding */}
//       <header className="w-full flex justify-center py-8 bg-white/80 shadow-md">
//         <h1 className="text-4xl font-extrabold text-blue-700 tracking-tight drop-shadow-lg">
//           🚌 Bus Tracking System
//         </h1>
//       </header>

//       {/* Hero Section */}
//       <main className="flex-1 flex flex-col items-center justify-center px-4">
//         <div className="max-w-xl w-full bg-white/90 rounded-2xl shadow-2xl p-10 flex flex-col items-center">
//           <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">Welcome!</h2>
//           <p className="text-gray-600 mb-8 text-center">
//             Track your bus, stay updated, and connect with your driver. Please select your role to continue:
//           </p>
//           <div className="flex flex-col gap-4 w-full">
//             <button
//               onClick={() => navigate("/login/student")}
//               className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg shadow-lg hover:bg-blue-600 text-lg font-semibold transition"
//             >
//               Student Login
//             </button>
//             <button
//               onClick={() => navigate("/login/driver")}
//               className="w-full px-6 py-3 bg-green-500 text-white rounded-lg shadow-lg hover:bg-green-600 text-lg font-semibold transition"
//             >
//               Driver Login
//             </button>
//             <button
//               onClick={() => navigate("/login/admin")}
//               className="w-full px-6 py-3 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 text-lg font-semibold transition"
//             >
//               Admin Login
//             </button>
//           </div>
//         </div>
//       </main>

//       {/* Footer */}
//       <footer className="w-full text-center py-4 text-gray-400 text-sm">
//         &copy; {new Date().getFullYear()} Bus Tracking System. All rights reserved.
//       </footer>
//     </div>
//   );
// }

// pages/RoleSelection.js
import { useNavigate } from "react-router-dom";

export default function RoleSelection() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Bus Tracking System</h1>
      <div className="space-y-8">
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