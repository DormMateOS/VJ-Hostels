import useCurrentUser from '../../hooks/student/useCurrentUser'
import { Home, Bell, Users, MessageSquare, LogOut, User, Utensils, UserCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../../styles/student/custom.css';

function Navbar({ onNavigate, isDesktop = false }) {
    const { user, loading } = useCurrentUser();
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
                        icon={<UserCheck size={18} />}
                        label="Visitors"
                        to="visitors"
                        isActive={location.pathname.includes('/home/visitors')}
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
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'transparent'
        }}>
            <nav style={{
                flex: 1,
                padding: '0.5rem 0',
                overflowY: 'auto'
            }}>
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
                <NavItem
                    icon={<UserCheck size={20} />}
                    label="Visitors"
                    to="visitors"
                    isActive={location.pathname.includes('/home/visitors')}
                    onClick={handleNavClick}
                />
            </nav>

            <div style={{
                padding: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    {user && (
                        <>
                            {user.profilePhoto ? (
                                <img
                                    src={user.profilePhoto}
                                    alt="Profile"
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        border: '2px solid rgba(255, 255, 255, 0.3)'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1.125rem'
                                }}>
                                    <span>{user.name ? user.name.charAt(0).toUpperCase() : 'S'}</span>
                                </div>
                            )}
                            <div>
                                <p style={{
                                    margin: 0,
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '0.875rem'
                                }}>{user.name || 'Student'}</p>
                                <p style={{
                                    margin: 0,
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '0.75rem'
                                }}>ID: {user.rollNumber || 'N/A'}</p>
                            </div>
                        </>
                    )}
                    {!user && (
                        <>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '1.125rem'
                            }}>
                                <span>S</span>
                            </div>
                            <div>
                                <p style={{
                                    margin: 0,
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '0.875rem'
                                }}>Student</p>
                                <p style={{
                                    margin: 0,
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '0.75rem'
                                }}>ID: N/A</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

const NavItem = ({ icon, label, to, isActive, onClick, isDesktop = false }) => {
    if (isDesktop) {
        return (
            <Link
                to={to}
                className={`nav-item ${isActive ? 'active' : ''} desktop-nav-item`}
                onClick={onClick}
                title={label}
            >
                <div className="icon-container">{icon}</div>
                <span className="fw-medium">{label}</span>
            </Link>
        );
    }

    return (
        <Link
            to={to}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.25rem',
                color: isActive ? '#dc2626' : 'white',
                backgroundColor: isActive ? 'white' : 'transparent',
                textDecoration: 'none',
                borderRadius: isActive ? '0 25px 25px 0' : '0',
                marginRight: isActive ? '0.5rem' : '0',
                transition: 'all 0.2s ease-in-out',
                fontWeight: '500',
                fontSize: '0.9rem',
                position: 'relative',
                borderLeft: isActive ? '4px solid #dc2626' : '4px solid transparent'
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.target.style.paddingLeft = '1.5rem';
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.paddingLeft = '1.25rem';
                }
            }}
        >
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '24px'
            }}>
                {icon}
            </div>
            <span style={{
                fontWeight: isActive ? '600' : '500'
            }}>
                {label}
            </span>
        </Link>
    );
};

export default Navbar
