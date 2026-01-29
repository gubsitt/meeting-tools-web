import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

export default function Layout({ children }) {
  // 1. สร้าง State ไว้ที่นี่ (อ่านค่าจาก LocalStorage)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed')
    return saved === 'true' // แปลง string เป็น boolean
  })

  // State for Mobile Sidebar
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
      if (window.innerWidth > 768) {
        setIsMobileOpen(false) // Reset on desktop
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ฟังก์ชันสำหรับเปลี่ยน State และบันทึกลง LocalStorage
  const handleToggleSidebar = (value) => {
    // ถ้าส่ง value มาให้ใช้ value นั้น ถ้าไม่ส่งให้สลับค่าเดิม (รองรับทั้ง direct set และ toggle)
    const newState = typeof value === 'boolean' ? value : !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebarCollapsed', newState)
  }

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}> {/* ให้โปร่งใสเพื่อโชว์ Gradient จาก body */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={handleToggleSidebar}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      <main style={{
        flex: 1,
        marginLeft: isMobile ? '0' : (isCollapsed ? '80px' : '260px'),
        width: isMobile ? '100%' : (isCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 260px)'),
        transition: 'all 0.3s ease',
        color: 'white', // บังคับตัวหนังสือสีขาว
        position: 'relative'
      }}>
        {/* Mobile Menu Toggle Button */}
        {isMobile && (
          <button
            onClick={toggleMobileSidebar}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 40,
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Menu size={24} />
          </button>
        )}

        {children}
      </main>
    </div>
  )
}