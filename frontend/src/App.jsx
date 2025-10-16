import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Toaster } from 'react-hot-toast';
import LoginPage from './auth/LoginPage';
import StudentPage from './pages/StudentPage';
import AdminPage from './pages/AdminPage';
import SecurityPage from './pages/SecurityPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
        <Routes>
          {/* Default route - redirect to login */}
          <Route path="/" element={<LoginPage />} />
          
          {/* Login route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Role-based routes */}
          <Route path="/student/*" element={<StudentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/security" element={<SecurityPage />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;