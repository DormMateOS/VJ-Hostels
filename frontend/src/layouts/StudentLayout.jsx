import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Navbar from '../components/student/Navbar'
import AnnouncementBanner from '../components/student/AnnouncementBanner'
import useCurrentUser from '../hooks/student/useCurrentUser'
import { useAuthStore } from '../store/authStore'
import '../styles/student/custom.css'

function StudentLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { clearUser } = useCurrentUser()
  const { logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if current page is announcements page
  const isAnnouncementsPage = location.pathname.includes('/announcements')
const handleLogout = async () => {
  try {
    // Call auth store logout first to clear tokens and reset auth state
    await logout()
    
    // Clear user data
    clearUser()
    
    // Force a full page reload to login page
    window.location.href = '/login'
  } catch (error) {
    console.error('Logout error:', error)
    // Even if there's an error, navigate to login with reload
    window.location.href = '/login'
  }
}

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => isMobile && setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-gray-50" >
      {/* Navbar */}
      <nav style={{
        backgroundColor: '#f55353ff',
        color: 'white',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingLeft: '1rem',
          paddingRight: '1rem',
          paddingTop: '0.5rem',
          paddingBottom: '0.5rem'
        }}>
          {/* Left Section: Menu Button (mobile) + Logo + Title */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {isMobile && (
              <button
                style={{
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                onClick={toggleSidebar}
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
            )}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <img src="/logo.png" alt="VJ Hostels" height={50}  />
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                letterSpacing: '0.025em',
                whiteSpace: 'nowrap',
                margin: 0
              }}>VJ Hostels</h1>
            </div>
          </div>

          {/* Center Section: Nav Elements (desktop only) */}
          {!isMobile && (
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Navbar onNavigate={closeSidebar} isDesktop={true} />
            </div>
          )}

          {/* Right Section: Logout Button */}
          <button
            style={{
              backgroundColor: 'white',
              color: '#b91c1c',
              fontWeight: '600',
              paddingLeft: '1rem',
              paddingRight: '1rem',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background-color 0.15s ease-in-out'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>


      {/* Mobile Sidebar */}
      {isMobile && (
        <>
          <aside
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              height: '100vh',
              width: '280px',
              backgroundColor: '#dc2626',
              color: 'white',
              boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              zIndex: 50,
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease-in-out',
              overflowY: 'auto'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderBottom: '1px solid #ef4444',
              backgroundColor: '#b91c1c'
            }}>
              <h2 style={{
                fontWeight: 'bold',
                fontSize: '1.125rem',
                margin: 0,
                color: 'white'
              }}>Student Portal</h2>
              <button 
                onClick={toggleSidebar}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '0.375rem',
                  transition: 'background-color 0.15s ease-in-out'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <X size={24} />
              </button>
            </div>
            <div style={{
              padding: '0',
              height: 'calc(100vh - 80px)',
              overflowY: 'auto'
            }}>
              <Navbar onNavigate={closeSidebar} isDesktop={false} />
            </div>
          </aside>

          {/* Overlay for mobile */}
          {sidebarOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 40,
                backdropFilter: 'blur(2px)'
              }}
              onClick={closeSidebar}
            ></div>
          )}
        </>
      )}

      {/* Announcement Banner - Show on all pages except announcements */}
      {!isAnnouncementsPage && <AnnouncementBanner />}

      {/* Content */}
      <main className="flex-1 content-area">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default StudentLayout;