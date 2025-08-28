import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function StudentLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/student.json')
      .then(response => response.json())
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

  const handleLogin = (e) => {
    e.preventDefault();
    const student = students.find(s => s.email === email && s.password === password);
    
    if (student) {
      localStorage.setItem('userType', 'student');
      localStorage.setItem('studentData', JSON.stringify(student));
      navigate('/student/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80")'
        }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-800/70 to-blue-700/80"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-pattern">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative bg-white/95 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-md transform hover:scale-105 transition-all duration-300 border border-white/20">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">🎓</div>
          <h2 className="text-3xl font-bold gradient-text-blue mb-2">Student Portal</h2>
          <p className="text-gray-600">Access your bus tracking dashboard</p>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto mt-2 rounded-full"></div>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Login
          </button>
        </form>
        
        <button
          onClick={() => navigate('/')}
          className="w-full mt-6 bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105 shadow-lg btn-hover"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}