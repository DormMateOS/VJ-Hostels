import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Navbar from '../components/Navbar';
import useCurrentUser from '../hooks/useCurrentUser';
import DebugAuth from '../components/DebugAuth';
import VisitorNotification from '../components/VisitorNotification';
import backgroundImage from '../assets/1.jpg';

function RootLayout() {
    const navigate = useNavigate();
    const { clearUser } = useCurrentUser();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const handleLogout = () => {
        clearUser();
        navigate('/login');
    };

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setSidebarOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
    };

    return (
        <div
            className="root-layout"
            style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* <DebugAuth /> */}
            {/* Header */}
            <header className="header-bar">
                <div className="header-content">
                    <div className="header-left">
                        {isMobile && (
                            <button
                                className="mobile-menu-btn"
                                onClick={toggleSidebar}
                                aria-label="Toggle menu"
                            >
                                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        )}
                        <div className="logo-container">
                            <img src="/logo.png" alt="VJ Hostels" className="header-logo" />
                            <h1 className="header-title">VJ Hostels</h1>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    {!isMobile && (
                        <nav className="desktop-nav">
                            <Navbar onNavigate={closeSidebar} isDesktop={true} />
                        </nav>
                    )}

                    <button className="btn btn-danger logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </header>

            {/* Mobile Overlay */}
            {isMobile && sidebarOpen && (
                <div className="mobile-overlay" onClick={closeSidebar}></div>
            )}

            {/* Main Content Area */}
            <div className="main-container">
                {/* Mobile Sidebar */}
                {isMobile && (
                    <aside className={`sidebar sidebar-mobile ${sidebarOpen ? 'sidebar-open' : ''}`}>
                        <Navbar onNavigate={closeSidebar} isDesktop={false} />
                    </aside>
                )}

                {/* Content */}
                <main className="content-area">
                    <div className="content-wrapper">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Visitor Notifications */}
            <VisitorNotification />
        </div>
    )
}

export default RootLayout