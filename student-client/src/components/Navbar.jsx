import { useUser } from '../context/UserContext'
import { Home, Bell, Users, MessageSquare, LogOut, User, Utensils } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/custom.css';

function Navbar({ onNavigate, isDesktop = false }) {
    const { user } = useUser();
    const location = useLocation();

    const handleNavClick = () => {
        if (onNavigate) {
            onNavigate();
        }
    };

    if (isDesktop) {
        // Desktop horizontal navbar
        return (
            <div className="desktop-navbar">
                <nav className="desktop-nav-container">
                    <NavItem
                        icon={<Home size={18} />}
                        label="Home"
                        to=""
                        isActive={location.pathname === '/home' || location.pathname === '/home/'}
                        onClick={handleNavClick}
                        isDesktop={true}
                    />
                    <NavItem
                        icon={<Bell size={18} />}
                        label="Announcements"
                        to="announcements"
                        isActive={location.pathname.includes('/home/announcements')}
                        onClick={handleNavClick}
                        isDesktop={true}
                    />
                    <NavItem
                        icon={<Users size={18} />}
                        label="Community"
                        to="community"
                        isActive={location.pathname.includes('/home/community')}
                        onClick={handleNavClick}
                        isDesktop={true}
                    />
                    <NavItem
                        icon={<MessageSquare size={18} />}
                        label="Complaints"
                        to="complaints"
                        isActive={location.pathname.includes('/home/complaints')}
                        onClick={handleNavClick}
                        isDesktop={true}
                    />
                    <NavItem
                        icon={<LogOut size={18} />}
                        label="Outpass"
                        to="outpass"
                        isActive={location.pathname.includes('/home/outpass')}
                        onClick={handleNavClick}
                        isDesktop={true}
                    />
                    <NavItem
                        icon={<Utensils size={18} />}
                        label="Food"
                        to="food"
                        isActive={location.pathname.includes('/home/food')}
                        onClick={handleNavClick}
                        isDesktop={true}
                    />
                     <NavItem
                        icon={<User size={18} />}
                        label="Profile"
                        to="profile"
                        isActive={location.pathname.includes('/home/profile')}
                        onClick={handleNavClick}
                        isDesktop={true}
                    />
                </nav>
            </div>
        );
    }

    // Mobile vertical sidebar
    return (
        <div className="student-navbar">
            <div className="navbar-header">
                <h1 className="fw-bold">Student Portal</h1>
            </div>

            <nav className="nav-container">
                <NavItem
                    icon={<Home size={20} />}
                    label="Home"
                    to=""
                    isActive={location.pathname === '/home' || location.pathname === '/home/'}
                    onClick={handleNavClick}
                />
                <NavItem
                    icon={<Bell size={20} />}
                    label="Announcements"
                    to="announcements"
                    isActive={location.pathname.includes('/home/announcements')}
                    onClick={handleNavClick}
                />
                <NavItem
                    icon={<Users size={20} />}
                    label="Community"
                    to="community"
                    isActive={location.pathname.includes('/home/community')}
                    onClick={handleNavClick}
                />
                <NavItem
                    icon={<MessageSquare size={20} />}
                    label="Complaints"
                    to="complaints"
                    isActive={location.pathname.includes('/home/complaints')}
                    onClick={handleNavClick}
                />
                <NavItem
                    icon={<LogOut size={20} />}
                    label="Outpass"
                    to="outpass"
                    isActive={location.pathname.includes('/home/outpass')}
                    onClick={handleNavClick}
                />
                <NavItem
                    icon={<User size={20} />}
                    label="Student Profile"
                    to="profile"
                    isActive={location.pathname.includes('/home/profile')}
                    onClick={handleNavClick}
                />
                <NavItem
                    icon={<Utensils size={20} />}
                    label="Food"
                    to="food"
                    isActive={location.pathname.includes('/home/food')}
                    onClick={handleNavClick}
                />
            </nav>

            <div className="profile-container">
                <div className="profile">
                    {user && (
                        <>
                            {user.profilePhoto ? (
                                <img
                                    src={user.profilePhoto}
                                    alt="Profile"
                                    className="avatar"
                                    style={{
                                        objectFit: 'cover',
                                        padding: 0
                                    }}
                                />
                            ) : (
                                <div className="avatar">
                                    <span>{user.name ? user.name.charAt(0).toUpperCase() : 'S'}</span>
                                </div>
                            )}
                            <div className="profile-info">
                                <p className="name mb-0">{user.name || 'Student'}</p>
                                <p className="id mb-0">ID: {user.rollNumber || 'N/A'}</p>
                            </div>
                        </>
                    )}
                    {!user && (
                        <div className="profile">
                            <div className="avatar">
                                <span>S</span>
                            </div>
                            <div className="profile-info">
                                <p className="name mb-0">Student</p>
                                <p className="id mb-0">ID: N/A</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const NavItem = ({ icon, label, to, isActive, onClick, isDesktop = false }) => {
    return (
        <Link
            to={to}
            className={`nav-item ${isActive ? 'active' : ''} ${isDesktop ? 'desktop-nav-item' : ''}`}
            onClick={onClick}
            title={isDesktop ? label : undefined}
        >
            <div className="icon-container">{icon}</div>
            <span className="fw-medium">{label}</span>
        </Link>
    );
};

export default Navbar