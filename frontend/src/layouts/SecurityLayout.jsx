import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import '../styles/security/custom.css';

const SecurityLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  
  const isActive = (path) => {
    return location.pathname === `/security${path}`;
  };

const handleLogout = async () => {
  try {
    // Call auth store logout to clear tokens and reset auth state
    await logout();
    
    // Force a full page reload to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, navigate to login with reload
    window.location.href = '/login';
  }
};

  return (
    <div className="security-layout">
      {/* Header */}
      <header className="security-header">
        <div className="security-header-container">
          <div className="header-content">
            {/* Logo Section */}
            <div className="logo-section">
              <div className="logo-box">
                <span>🛡️</span>
              </div>
              <div className="logo-text">
                <h1>Security Dashboard</h1>
                <p>VNR VJIET Hostel Management</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="nav-section">
              <Link 
                to="/security/home" 
                className={`nav-link ${isActive('/home') ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link 
                to="/security/visitors" 
                className={`nav-link ${isActive('/visitors') ? 'active' : ''}`}
              >
                Visitors
              </Link>
              <Link 
                to="/security/attendance" 
                className={`nav-link ${isActive('/attendance') ? 'active' : ''}`}
              >
                Attendance
              </Link>
            </nav>

            {/* Right Section */}
            <div className="user-section">
              <div className="user-info">
                <p className="user-name">Security Guard</p>
                <p className="user-status">Online</p>
              </div>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="security-main">
        <Outlet />
      </main>
    </div>
  );
};

export default SecurityLayout;