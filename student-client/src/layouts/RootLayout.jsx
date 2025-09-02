import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Navbar from '../components/Navbar'
import useCurrentUser from '../hooks/useCurrentUser'
import backgroundImage from '../assets/1.jpg'

function RootLayout() {
  const navigate = useNavigate()
  const { clearUser } = useCurrentUser()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const handleLogout = () => {
    clearUser()
    navigate('/login')
  }

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setSidebarOpen(true) // always open on desktop
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => isMobile && setSidebarOpen(false)

  return (
    <div
      className="min-h-screen flex"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Sidebar (always on desktop, toggle on mobile) */}
      <aside
        className={`fixed md:static top-0 left-0 h-full md:h-auto w-64 bg-red-700 text-white shadow-lg z-50 transform transition-transform duration-300 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b border-red-500 md:border-b-0">
          <h2 className="font-bold text-lg">Menu</h2>
          {isMobile && (
            <button onClick={toggleSidebar}>
              <X size={24} />
            </button>
          )}
        </div>
        <div className="p-4">
          <Navbar onNavigate={closeSidebar} isDesktop={!isMobile} />
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-red-700 text-white shadow-md sticky top-0 z-30 flex justify-between items-center px-4 py-3">
          <div className="flex items-center space-x-3">
            {isMobile && (
              <button
                className="p-2 rounded-md hover:bg-red-600 transition"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
              >
                <Menu size={24} />
              </button>
            )}
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="VJ Hostels" className="h-10 w-auto" />
              <h1 className="text-xl font-bold tracking-wide">VJ Hostels</h1>
            </div>
          </div>

          <button
            className="bg-white text-red-700 font-semibold px-4 py-2 rounded-lg shadow hover:bg-red-100 transition"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-white bg-opacity-95 md:ml-64">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default RootLayout
