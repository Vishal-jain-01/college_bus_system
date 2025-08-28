// src/pages/StudentsList.js
import { useEffect, useState } from "react";
import { Route } from "react-router-dom";
import StudentLogin from "./StudentLogin";

export default function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/student.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load student data');
        }
        return response.json();
      })
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading student data:', err);
        setError('Failed to load student data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6">Loading students...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Students</h1>
      <table className="border-collapse border border-gray-400 w-full">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-400 px-4 py-2">Roll No</th>
            <th className="border border-gray-400 px-4 py-2">Name</th>
            <th className="border border-gray-400 px-4 py-2">Email</th>
            <th className="border border-gray-400 px-4 py-2">Bus ID</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s, index) => (
            <tr key={index}>
              <td className="border border-gray-400 px-4 py-2">{s.rollNo}</td>
              <td className="border border-gray-400 px-4 py-2">{s.name}</td>
              <td className="border border-gray-400 px-4 py-2">{s.email}</td>
              <td className="border border-gray-400 px-4 py-2">{s.bus.$oid}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Route path="/login/student" element={<StudentLogin />} />
    </div>
  );
}