import { useState, useCallback } from 'react'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import CalendarService from '../services/CalendarService'
import { motion } from 'framer-motion'
import Loading from '../components/Loading'
// ✅ รวม Import ไว้ในบรรทัดเดียว (มี Trash2 เรียบร้อย)
import toast from 'react-hot-toast'
import { Search } from 'lucide-react'
import CalendarEventModal from '../components/CalendarEventModal'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './Calendar.css'

const localizer = momentLocalizer(moment)

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [roomEmail, setRoomEmail] = useState('dev365.room1@exzydev.onmicrosoft.com')
  const [searchQuery, setSearchQuery] = useState('')

  const [dateRange, setDateRange] = useState({
    start: moment().startOf('month').format('YYYY-MM-DD'),
    end: moment().endOf('month').format('YYYY-MM-DD')
  })

  const [currentDate, setCurrentDate] = useState(new Date())

  // State สำหรับเก็บ Event ที่ถูกกดเลือก
  const [selectedEvent, setSelectedEvent] = useState(null)

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!roomEmail) return;

    setLoading(true)
    try {
      // ... existing imports

      const res = await CalendarService.getEvents(roomEmail, dateRange.start, dateRange.end, searchQuery)

      if (res.success && res.data) {
        // 👇 [เพิ่มใหม่] กรองเอาเฉพาะ Event ที่ 'ไม่' ขึ้นต้นด้วย Canceled:
        const activeEvents = res.data.filter(item => !item.subject.startsWith('Canceled:'))

        // เอาตัวที่กรองแล้วมา map ต่อ
        const formattedEvents = activeEvents.map(item => ({
          id: item.id,
          title: item.subject,
          start: new Date(item.start.dateTime + 'Z'),
          end: new Date(item.end.dateTime + 'Z'),
          resource: item,
          isCancelled: false, // ไม่จำเป็นต้องเช็คแล้ว เพราะเรากรองทิ้งหมดแล้ว
          location: item.location?.displayName || 'Unknown Location'
        }))

        setEvents(formattedEvents)

        // If search returned items, jump to the first one's date
        if (formattedEvents.length > 0) {
          setCurrentDate(formattedEvents[0].start);
          toast.success(`Found ${formattedEvents.length} events`)
        } else {
          // Keep current date if just refreshing or empty
          if (!searchQuery) {
            setCurrentDate(new Date(dateRange.start))
          }
          toast('No events found')
        }

      } else {
        setEvents([])
        toast.error('No events found or Room not available')
      }
    } catch (error) {
      console.error("Failed to fetch calendar events", error)
      setEvents([])
      toast.error('Error fetching events')
    } finally {
      setLoading(false)
    }
  }
  // ฟังก์ชันเมื่อกดที่ Event ในปฏิทิน
  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
  }

  // ฟังก์ชันปิด Modal
  const closeModal = () => {
    setSelectedEvent(null)
  }

  const eventStyleGetter = (event) => {
    let backgroundColor = '#6c5ce7'
    if (event.isCancelled) backgroundColor = '#ff6b6b'

    return {
      style: {
        backgroundColor,
        borderRadius: '6px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        textDecoration: event.isCancelled ? 'line-through' : 'none'
      }
    }
  }

  const handleDelete = async () => {
    if (!selectedEvent) return

    // ถามยืนยันก่อนลบ
    const confirmDelete = window.confirm(`Are you sure you want to delete "${selectedEvent.title}"?`)
    if (!confirmDelete) return

    setLoading(true)
    try {
      // เรียก Service ลบ
      await CalendarService.deleteEvent(selectedEvent.id)

      // ปิด Modal
      closeModal()

      // ดึงข้อมูลใหม่เพื่ออัปเดตหน้าจอ
      await handleSearch()

    } catch (error) {
      console.error("Failed to delete event", error)
      alert("Failed to delete event. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="calendar-page">
      {/* Floating Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <motion.div
        className="calendar-header-control"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1>Meeting Schedule</h1>
          <p>Search room availability</p>
        </div>
      </motion.div>

      <motion.div
        className="search-bar-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleSearch} className="search-form">
          {/* Search Input */}
          <div className="form-group-inline" style={{ flex: 1, minWidth: '300px' }}>
            <label>Search (ID / iCalUID)</label>
            <input
              type="text"
              className="custom-input"
              placeholder="Paste Event ID or iCalUID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="form-group-inline">
            <label>Room Email</label>
            <input type="text" placeholder="Enter room email..." value={roomEmail} onChange={(e) => setRoomEmail(e.target.value)} className="custom-input" />
          </div>
          <div className="form-group-inline">
            <label>Start Date</label>
            <input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="custom-input date-input" />
          </div>
          <div className="form-group-inline">
            <label>End Date</label>
            <input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="custom-input date-input" />
          </div>
          <div className="form-group-inline" style={{ minWidth: 'auto', flex: 'none' }}>
            <label style={{ opacity: 0 }}>Search</label>
            <button type="submit" className="search-btn" disabled={loading}>
              <Search size={18} /> {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </motion.div>

      <motion.div
        className="calendar-wrapper"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        {loading && <div className="calendar-loading-overlay"><Loading /></div>}

        <BigCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '75vh', minHeight: '600px' }}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day', 'agenda']}
          defaultView="month"
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          popup
          onSelectEvent={handleSelectEvent}
        />
      </motion.div>

      <CalendarEventModal
        isOpen={!!selectedEvent}
        onClose={closeModal}
        event={selectedEvent}
        onDelete={handleDelete}
        loading={loading}
      />

    </div >
  )
}