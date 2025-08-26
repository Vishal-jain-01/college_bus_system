// pages/DriverLogin.js
export default function DriverLogin() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50">
      <h2 className="text-xl font-semibold mb-4 text-green-700">Driver Login</h2>
      <form className="bg-white p-6 rounded-xl shadow-md w-80 space-y-4">
        <input
          type="text"
          placeholder="Driver ID"
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
        <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
          Login
        </button>
      </form>
    </div>
  );
}