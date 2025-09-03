
import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import './App.css';

// Context
import { useAdmin } from './context/AdminContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Announcements from './pages/Announcements';
import Complaints from './pages/Complaints';
import Outpasses from './pages/Outpasses';
import Community from './pages/Community';
import Profile from './pages/Profile';
import Rooms from './pages/Rooms';
import Food from './pages/Food';
import Visitors from './pages/Visitors';
import AuthHandler from './pages/AuthHandler';

function App() {
  const { isAuthenticated } = useAdmin();

  // Add Bootstrap icons
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated() ? <Login /> : <Navigate to="/dashboard" replace />} />

      <Route path="/auth/callback" element={<AuthHandler />} />

      <Route path="/dashboard" element={isAuthenticated() ? <DashboardLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="outpasses" element={<Outpasses />} />
        <Route path="community" element={<Community />} />
        <Route path="food" element={<Food />} />
        <Route path="visitors" element={<Visitors />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
