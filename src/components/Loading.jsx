import { motion } from 'framer-motion'
import '../styles/components/Loading.css'

export default function Loading() {
  return (
    <div className="loading-container">
      {/* ลบ framer-motion animate ออก ใช้แค่ CSS animation */}
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="loading-text"
      >
        Loading<span className="dots">...</span>
      </motion.p>
    </div>
  )
}
