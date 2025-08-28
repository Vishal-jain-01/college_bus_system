import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


export default function StudentDashboard() {
    const [student, setStudent] = useState(null);
    const [bus, setBus] = useState(null);
    const [driver, setDriver] = useState(null);
    const [alert, setAlert] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login/student");
            return;
        }
        axios
            .get("http://localhost:5000/api/auth/students/me", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                setStudent(res.data.student);
                setBus(res.data.bus);
                setDriver(res.data.driver);
                setAlert(res.data.alert || "Bus is on time");
            })
            .catch(() => navigate("/login/student"));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login/student");
    };

    return (
        <div className="min-h-screen bg-blue-50 flex flex-col justify-between">
            {/* Header */}
            <div className="flex justify-between items-center p-6 bg-white shadow-md">
                <div className="text-lg font-semibold text-blue-700">
                    Hello, {student ? student.name : "Student"}
                </div>
                <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 transition text-white px-5 py-2 rounded font-medium"
                >
                    Logout
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-full max-w-2xl flex flex-col items-center">
                    {/* Bus Route Map */}
                    <div className="w-full bg-white rounded-xl shadow p-6 mt-12 flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-6 text-blue-800">Bus Route Tracking</h2>
                        <div className="w-full h-72 bg-gray-200 flex items-center justify-center rounded-lg mb-8 border-2 border-blue-100">
                            <span className="text-gray-500 text-lg">[Bus Route Map Here]</span>
                        </div>
                        {/* Bus Status */}
                        <div className="w-full flex justify-center mb-6">
                            <div className="bg-yellow-100 text-yellow-800 px-6 py-3 rounded text-center font-semibold shadow">
                                {alert}
                            </div>
                        </div>
                        {/* Driver Number */}
                        <div className="w-full flex justify-center mb-4">
                            <span className="font-semibold text-gray-700">Driver Number: </span>
                            <span className="ml-2 text-gray-900">{driver && driver.phone ? driver.phone : "N/A"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Call Driver Button at Bottom */}
            <div className="w-full flex justify-center pb-8">
                {driver && driver.phone && (
                    <a
                        href={`tel:${driver.phone}`}
                        className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg transition"
                    >
                        Call Driver
                    </a>
                )}
            </div>
        </div>
    );
}
