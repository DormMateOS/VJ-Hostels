import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import Navbar from '../components/student/Navbar'
import AnnouncementBanner from '../components/student/AnnouncementBanner'
import useCurrentUser from '../hooks/student/useCurrentUser'
import { useAuthStore } from '../store/authStore'
import '../styles/student/custom.css'
import logo from '../assets/vnrvjiet-logo.png';


function StudentLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { clearUser } = useCurrentUser()
  const { logout } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // Initialize isMobile from the current window size so mobile UI is correct on first render
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false)

  const isAnnouncementsPage = location.pathname.includes('/announcements')

  const handleLogout = async () => {
    try {
      await logout()
      clearUser()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/login'
    }
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => isMobile && setSidebarOpen(false)

  // close on Escape for better UX
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav style={{
        backgroundColor: '#800000', // maroon
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
          padding: '0.5rem 1rem'
        }}>
          {/* Left Section */}
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
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4d0000'}
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
<img 
  src={logo} 
  alt="VJ Hostels" 
  style={{ height: '35px', width: 'auto' }} 
/>
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                letterSpacing: '0.025em',
                whiteSpace: 'nowrap',
                margin: 0
              }}>VJ Hostels</h1>
            </div>
          </div>

          {/* Center Section */}
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

          {/* Compact Logout Icon Button */}
          <button
            aria-label="Logout"
            title="Logout"
            onClick={handleLogout}
            style={{
              backgroundColor: 'white',
              color: '#800000',
              padding: '0.25rem',
              width: '36px',
              height: '36px',
              borderRadius: '999px',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease-in-out, transform 0.08s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f3e8e8'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'none'; }}
          >
            <LogOut size={16} />
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
              width: 'min(320px, 75%)',
              backgroundColor: '#800000',
              color: 'white',
              boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
              zIndex: 50,
              transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease-in-out',
              overflowY: 'auto'
            }}
            aria-hidden={!sidebarOpen}
            id="student-sidebar"
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              borderBottom: '1px solid #990000',
              backgroundColor: '#660000'
            }}>
              <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                <img src={logo} alt="VJ Hostels" style={{ height: '42px', width: 'auto' }} />
                <div style={{color: 'white'}}>
                  <div style={{fontWeight: '700', fontSize: '0.95rem', lineHeight: 1}}>VNRVJIET</div>
                  <div style={{fontSize: '0.72rem', opacity: 0.9}}>Student Portal</div>
                </div>
              </div>
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
              padding: 0,
              height: 'calc(100vh - 80px)',
              overflowY: 'auto'
            }}>
              <Navbar onNavigate={closeSidebar} isDesktop={false} isInSidebar={true} />
            </div>
          </aside>

          {/* Overlay */}
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

      {/* Announcement Banner */}
      {!isAnnouncementsPage && <AnnouncementBanner />}

      {/* Page Content */}
      <main className="flex-1 content-area">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default StudentLayout
