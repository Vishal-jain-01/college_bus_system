import { useState } from "react";
import { useNavigate } from "react-router-dom";  // ✅ import navigation
import axios from "axios";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();  // ✅ initialize navigate

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/api/auth/student/login", {
        email,
        password,
      });

      alert("✅ Login Successful!");
      console.log(res.data);

      // save token
      localStorage.setItem("token", res.data.token);

      setError("");

      // ✅ redirect student to dashboard
      navigate("/student/dashboard");

    } catch (err) {
      const errorMsg = err.response?.data?.message || "❌ Login failed!";
      setError(errorMsg);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50">
      <h2 className="text-xl font-semibold mb-4">Student Login</h2>

      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded-xl shadow-md w-80 space-y-4"
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <br/>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <br/>
        <br/>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>

        {error && (
          <p className="text-red-500 text-sm text-center mt-2">{error}</p>
        )}
      </form>
    </div>
  );
}