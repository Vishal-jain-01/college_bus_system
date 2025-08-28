
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function DriverLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/auth/driver/login", {
        email,
        password,
      });
      alert("✅ Login Successful!");
      localStorage.setItem("token", res.data.token);
      setError("");
      navigate("/driver/dashboard");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "❌ Login failed!";
      setError(errorMsg);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50">
      <h2 className="text-xl font-semibold mb-4 text-green-700">Driver Login</h2>
      <form onSubmit={handleLogin} className="bg-white p-6 rounded-xl shadow-md w-80 space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <br/>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <br/><br/>
        <button type="submit" className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
          Login
        </button>
        {error && (
          <p className="text-red-500 text-sm text-center mt-2">{error}</p>
        )}
      </form>
    </div>
  );
}