// src/pages/StudentsList.js
import { useEffect, useState } from "react";
import axios from "axios";
import { Route } from "react-router-dom";
import StudentLogin from "./StudentLogin";

export default function StudentsList() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/students/me")
      .then(res => setStudents(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Students</h1>
      <table className="border-collapse border border-gray-400 w-full">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 px-4 py-2">Roll No</th>
            <th className="border border-gray-400 px-4 py-2">Name</th>
            <th className="border border-gray-400 px-4 py-2">Email</th>
            <th className="border border-gray-400 px-4 py-2">Bus</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s._id}>
              <td className="border border-gray-400 px-4 py-2">{s.rollNo}</td>
              <td className="border border-gray-400 px-4 py-2">{s.name}</td>
              <td className="border border-gray-400 px-4 py-2">{s.email}</td>
              <td className="border border-gray-400 px-4 py-2">{s.bus?.busNumber}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Route path="/login/student" element={<StudentLogin />} />
    </div>
  );
}