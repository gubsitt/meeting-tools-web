import { useState } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  // 1. สร้าง State ไว้ที่นี่
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#16213e' }}>
      {/* 2. ส่ง State ไปให้ Sidebar ใช้งาน */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* 3. ปรับขอบซ้ายของเนื้อหา ตามสถานะ isCollapsed */}
      <main style={{ 
        flex: 1, 
        marginLeft: isCollapsed ? '80px' : '260px', 
        width: isCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 260px)',
        transition: 'all 0.3s ease'
      }}>
        {children}
      </main>
    </div>
  )
}