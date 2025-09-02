import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import '../styles/custom.css';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { to: '/dashboard', icon: 'speedometer2', label: 'Dashboard' },
    { to: '/dashboard/students', icon: 'people', label: 'Students' },
    { to: '/dashboard/rooms', icon: 'building', label: 'Rooms' },
    { to: '/dashboard/announcements', icon: 'megaphone', label: 'Announcements' },
    { to: '/dashboard/complaints', icon: 'exclamation-triangle', label: 'Complaints' },
    { to: '/dashboard/outpasses', icon: 'box-arrow-right', label: 'Outpasses' },
    { to: '/dashboard/community', icon: 'chat-dots', label: 'Community' },
    { to: '/dashboard/food', icon: 'cup-hot', label: 'Food' },
  ];

  return (
    <div className="d-flex vh-100">
      {/* Sidebar */}
      <nav className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header d-flex justify-content-between align-items-center">
          {sidebarOpen && <h5 className="sidebar-title">Hostel Admin</h5>}
          <button
            className="btn btn-sm toggle-btn"
            onClick={toggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <i className={`bi bi-chevron-${sidebarOpen ? 'left' : 'right'}`}></i>
          </button>
        </div>

        <ul className="nav flex-column sidebar-nav">
          {menuItems.map(({ to, icon, label }) => (
            <li className="nav-item" key={to}>
              <NavLink
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) =>
                  `nav-link d-flex align-items-center${isActive ? ' active' : ''}`
                }
              >
                <i className={`bi bi-${icon} icon`}></i>
                {sidebarOpen && <span className="nav-label">{label}</span>}
              </NavLink>
            </li>
          ))}
          <li className="nav-item mt-3">
            <NavLink
              to="/dashboard/profile"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center${isActive ? ' active' : ''}`
              }
            >
              <i className="bi bi-person-circle icon"></i>
              {sidebarOpen && <span className="nav-label">Profile</span>}
            </NavLink>
          </li>
        </ul>

        {/* Sticky logout */}
        <div className="logout-container">
          <button
            className="nav-link logout-btn d-flex align-items-center w-100 border-0 bg-transparent"
            onClick={handleLogout}
            type="button"
            title="Logout"
          >
            <i className="bi bi-box-arrow-left icon"></i>
            {sidebarOpen && <span className="nav-label">Logout</span>}
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <header className="admin-header p-3 d-flex justify-content-between align-items-center">
          <h5 className="m-0">Hostel Management System</h5>
          <div className="d-flex align-items-center">
            <span className="me-3 fw-medium">{admin?.name || 'Admin'}</span>
            <div className="dropdown">
              <button
                className="btn btn-outline-primary dropdown-toggle"
                type="button"
                id="dropdownMenuButton"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle"></i>
              </button>
              <ul
                className="dropdown-menu dropdown-menu-end shadow-sm"
                aria-labelledby="dropdownMenuButton"
              >
                <li>
                  <NavLink className="dropdown-item" to="/dashboard/profile">
                    Profile
                  </NavLink>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <main className="admin-content flex-grow-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
