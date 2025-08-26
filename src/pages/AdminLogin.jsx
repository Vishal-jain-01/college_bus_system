// pages/AdminLogin.js
export default function AdminLogin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
      <h2 className="text-xl font-semibold mb-4 text-red-700">Admin Login</h2>
      <form className="bg-white p-6 rounded-xl shadow-md w-80 space-y-4">
        <input
          type="text"
          placeholder="Admin ID"
          className="w-full p-2 border rounded"
        />
        <br/>
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 border rounded"
        />
        <br/>
        <br/>
        <button className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600">
          Login
        </button>
      </form>
    </div>
  );
}