import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import '../styles/admin/custom.css'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { admin, logout } = useAdmin();
  const navigate = useNavigate();

const handleLogout = () => {
  logout();
  window.location.href = '/login';
};

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
          <div className="sidebar-nav-container">
              <ul className="nav flex-column">
                  <li className="nav-item">
                      <NavLink to="/admin" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                          {/* <i className="bi bi-speedometer2 me-3"></i> */}
                          {sidebarOpen && <span>Dashboard</span>}
                      </NavLink>
                  </li>
                  <li className="nav-item">
                      <NavLink to="/admin/students" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                          {/* <i className="bi bi-people me-3"></i> */}
                          {sidebarOpen && <span>Students</span>}
                      </NavLink>
                  </li>
                  <li className="nav-item">
                      <NavLink to="/admin/rooms" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                          {/* <i className="bi bi-building me-3"></i> */}
                          {sidebarOpen && <span>Rooms</span>}
                      </NavLink>
                  </li>
                  <li className="nav-item">
                      <NavLink to="/admin/announcements" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                          {/* <i className="bi bi-megaphone me-3"></i> */}
                          {sidebarOpen && <span>Announcements</span>}
                      </NavLink>
                  </li>
                  <li className="nav-item">
                      <NavLink to="/admin/complaints" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                          {/* <i className="bi bi-exclamation-triangle me-3"></i> */}
                          {sidebarOpen && <span>Complaints</span>}
                      </NavLink>
                  </li>
                  <li className="nav-item">
                      <NavLink to="/admin/outpasses" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                          {/* <i className="bi bi-box-arrow-right me-3"></i> */}
                          {sidebarOpen && <span>Outpasses</span>}
                      </NavLink>
                  </li>
                  <li className="nav-item">
                      <NavLink to="/admin/visitors" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                          {/* <i className="bi bi-people-fill me-3"></i> */}
                          {sidebarOpen && <span>Visitors</span>}
                      </NavLink>
                  </li>
                  <li className="nav-item">
                      <NavLink to="/admin/community" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                          {/* <i className="bi bi-chat-dots me-3"></i> */}
                          {sidebarOpen && <span>Community</span>}
                      </NavLink>
                  </li>
                  <li className="nav-item">
                      <NavLink to="/admin/food" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                          {/* <i className="bi bi-cup-hot me-3"></i> */}
                          {sidebarOpen && <span>Food</span>}
                      </NavLink>
                  </li>
                  <li className="nav-item">
                      <NavLink to="/admin/profile" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                          {/* <i className="bi bi-person-circle me-3"></i> */}
                          {sidebarOpen && <span>Profile</span>}
                      </NavLink>
                  </li>
                  <li className="nav-item">
                      <button
                          className="nav-link logout-btn d-flex align-items-center w-100 border-0 bg-transparent"
                          onClick={handleLogout}
                      >
                          {/* <i className="bi bi-box-arrow-left me-3"></i> */}
                          {sidebarOpen && <span>Logout</span>}
                      </button>
                  </li>
              </ul>
          </div>
      </nav>

      {/* Main content */}
      <div className="flex-grow-1 d-flex flex-column overflow-hidden">
        <header className="admin-header p-3 d-flex justify-content-between align-items-center">
          <h5 className="m-0">Hostel Management System</h5>
          <div className="d-flex align-items-center">
            <span className="me-3 fw-medium">{admin?.name || 'Admin'}</span>
            {/* <div className="dropdown">
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
                  <NavLink className="dropdown-item" to="/admin/profile">
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
            </div> */}
          </div>
        </header>

        <main className="admin-content flex-grow-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
