import { useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  // 1. สร้าง State ไว้ที่นี่
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'transparent' }}> {/* ให้โปร่งใสเพื่อโชว์ Gradient จาก body */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <main style={{
        flex: 1,
        marginLeft: isCollapsed ? '80px' : '260px',
        width: isCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 260px)',
        transition: 'all 0.3s ease',
        color: 'white' // บังคับตัวหนังสือสีขาว
      }}>
        {children}
      </main>
    </div>
  )
}