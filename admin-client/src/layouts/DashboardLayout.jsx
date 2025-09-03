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

    return (
        <div className="d-flex vh-100">
            {/* Sidebar */}
            <div className={`admin-sidebar ${sidebarOpen ? 'w-250px' : 'w-60px'}`} style={{ width: sidebarOpen ? '250px' : '60px' }}>
                <div className="sidebar-header d-flex justify-content-between align-items-center">
                    {sidebarOpen && <h5 className="m-0">Hostel Admin</h5>}
                    <button className="btn btn-sm" style={{ color: 'white', border: '1px solid rgba(255,255,255,0.2)' }} onClick={toggleSidebar}>
                        <i className={`bi bi-chevron-${sidebarOpen ? 'left' : 'right'}`}></i>
                    </button>
                </div>

                <div className="p-3">
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <NavLink to="/dashboard" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                                <i className="bi bi-speedometer2 me-3"></i>
                                {sidebarOpen && <span>Dashboard</span>}
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/dashboard/students" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                                <i className="bi bi-people me-3"></i>
                                {sidebarOpen && <span>Students</span>}
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/dashboard/rooms" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                                <i className="bi bi-building me-3"></i>
                                {sidebarOpen && <span>Rooms</span>}
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/dashboard/announcements" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                                <i className="bi bi-megaphone me-3"></i>
                                {sidebarOpen && <span>Announcements</span>}
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/dashboard/complaints" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                                <i className="bi bi-exclamation-triangle me-3"></i>
                                {sidebarOpen && <span>Complaints</span>}
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/dashboard/outpasses" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                                <i className="bi bi-box-arrow-right me-3"></i>
                                {sidebarOpen && <span>Outpasses</span>}
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/dashboard/community" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                                <i className="bi bi-chat-dots me-3"></i>
                                {sidebarOpen && <span>Community</span>}
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/dashboard/food" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                                <i className="bi bi-cup-hot me-3"></i>
                                {sidebarOpen && <span>Food</span>}
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to="/dashboard/visitors" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                                <i className="bi bi-people me-3"></i>
                                {sidebarOpen && <span>Visitors</span>}
                            </NavLink>
                        </li>
                        <li className="nav-item mt-4">
                            <NavLink to="/dashboard/profile" className={({isActive}) => `nav-link ${isActive ? 'active' : ''} d-flex align-items-center`}>
                                <i className="bi bi-person-circle me-3"></i>
                                {sidebarOpen && <span>Profile</span>}
                            </NavLink>
                        </li>
                        <li className="nav-item mt-3">
                            <button
                                className="nav-link logout-btn d-flex align-items-center w-100 border-0 bg-transparent"
                                onClick={handleLogout}
                            >
                                <i className="bi bi-box-arrow-left me-3"></i>
                                {sidebarOpen && <span>Logout</span>}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-grow-1 d-flex flex-column overflow-hidden">
                {/* Header */}
                <header className="admin-header p-3 d-flex justify-content-between align-items-center">
                    <h5 className="m-0">Hostel Management System</h5>
                    <div className="d-flex align-items-center">
                        <span className="me-3 fw-medium">{admin?.name || 'Admin'}</span>
                        <div className="dropdown">
                            <button className="btn btn-outline-primary dropdown-toggle" type="button" id="dropdownMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
                                <i className="bi bi-person-circle"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="dropdownMenuButton">
                                <li><NavLink className="dropdown-item" to="/dashboard/profile">Profile</NavLink></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></li>
                            </ul>
                        </div>
                    </div>
                </header>

                {/* Content area */}
                <div className="admin-content flex-grow-1 overflow-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
