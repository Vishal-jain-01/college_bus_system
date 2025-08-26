import { useState, useEffect } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load student data from JSON file
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

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    // Find student with matching email and password
    const student = students.find(s => 
      s.email === email && s.password === password
    );

    if (student) {
      setIsLoggedIn(true);
      setCurrentStudent(student);
    } else {
      setError('Invalid email or password');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  if (isLoggedIn) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Welcome, {currentStudent.name}!</h2>
        <p>Roll No: {currentStudent.rollNo}</p>
        <p>Email: {currentStudent.email}</p>
        <p>Bus ID: {currentStudent.bus.$oid}</p>
        <button onClick={() => setIsLoggedIn(false)}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Student Login</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" style={{ padding: '10px 20px', width: '100%' }}>
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
