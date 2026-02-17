import { useState, useCallback } from 'react'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import CalendarService from '../services/CalendarService'
import { motion, AnimatePresence } from 'framer-motion'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'
import { Search, Filter, X } from 'lucide-react'
import CalendarEventModal from '../components/CalendarEventModal'
import useMobileFilter from '../hooks/useMobileFilter'
import useDateRangeFilter from '../hooks/useDateRangeFilter'
import useSearchFilter from '../hooks/useSearchFilter'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './Calendar.css'

const localizer = momentLocalizer(moment)

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [roomEmail, setRoomEmail] = useState('')

  // Custom Hooks
  const mobileFilter = useMobileFilter(false)
  const dateFilter = useDateRangeFilter('', '')
  const searchFilter = useSearchFilter(500)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!roomEmail) return;

    setLoading(true)
    mobileFilter.close()

    try {
      const res = await CalendarService.getEvents(roomEmail, dateFilter.startDate, dateFilter.endDate, searchFilter.searchQuery)

      if (res.success && res.data) {
        const activeEvents = res.data.filter(item => !item.subject.startsWith('Canceled:'))

        const formattedEvents = activeEvents.map(item => ({
          id: item.id,
          title: item.subject,
          start: new Date(item.start.dateTime + 'Z'),
          end: new Date(item.end.dateTime + 'Z'),
          resource: item,
          isCancelled: false,
          location: item.location?.displayName || 'Unknown Location'
        }))

        setEvents(formattedEvents)

        if (formattedEvents.length > 0) {
          setCurrentDate(formattedEvents[0].start);
          toast.success(`Found ${formattedEvents.length} events`)
        } else {
          if (!searchFilter.searchQuery) {
            setCurrentDate(new Date(dateFilter.startDate))
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

  const handleClear = () => {
    setRoomEmail('')
    dateFilter.resetDates()
    searchFilter.clearSearch()
    setEvents([])
    mobileFilter.open()
  }

  const handleSelectEvent = (event) => {
    setSelectedEvent(event)
  }

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
    const confirmDelete = window.confirm(`Are you sure you want to delete "${selectedEvent.title}"?`)
    if (!confirmDelete) return

    setLoading(true)
    try {
      await CalendarService.deleteEvent(selectedEvent.id)
      closeModal()
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

      {/* --- Search Section --- */}
      <motion.div
        className="search-bar-container"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {/* ✅ Mobile Header: ปุ่มเปิด/ปิด Filter */}
        <div className="mobile-filter-header" onClick={mobileFilter.toggle}>
          <span><Search size={16} /> Filters & Search</span>
          <button type="button" className="icon-btn">
            {mobileFilter.isOpen ? <X size={20} /> : <Filter size={20} />}
          </button>
        </div>

        {/* ✅ Form Logic: Desktop เห็นตลอด, Mobile ต้องกดเปิดก่อน */}
        <div className={`search-form-wrapper ${mobileFilter.isOpen ? 'open' : ''}`}>
          <form onSubmit={handleSearch} className="search-form">

            {/* แถว 1: Search & Email */}
            <div className="form-group-inline search-input-wrapper">
              <label>Event ID</label>
              <input
                type="text"
                className="custom-input"
                placeholder="Search by Event ID..."
                value={searchFilter.searchQuery}
                onChange={(e) => searchFilter.setSearchQuery(e.target.value)}
              />
            </div>

            <div className="form-group-inline search-email-wrapper">
              <label>Room ID</label>
              <input type="text" placeholder="Search by Room ID..." value={roomEmail} onChange={(e) => setRoomEmail(e.target.value)} className="custom-input" />
            </div>

            {/* แถว 2: วันที่ (บนมือถือจะจัดให้อยู่บรรทัดเดียวกัน) */}
            <div className="date-group-row">
              <div className="form-group-inline">
                <label>Start Date</label>
                <input type="date" value={dateFilter.startDate} onChange={(e) => dateFilter.setStartDate(e.target.value)} className="custom-input date-input" />
              </div>
              <div className="form-group-inline">
                <label>End Date</label>
                <input type="date" value={dateFilter.endDate} onChange={(e) => dateFilter.setEndDate(e.target.value)} className="custom-input date-input" />
              </div>
            </div>

            {/* ปุ่ม Search */}
            <div className="form-group-inline search-btn-wrapper">
              <label className="desktop-only-label" style={{ opacity: 0 }}>Search</label>
              <button type="submit" className="search-btn" disabled={loading}>
                <Search size={18} /> {loading ? '...' : 'Search'}
              </button>
            </div>
          </form>
        </div>
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