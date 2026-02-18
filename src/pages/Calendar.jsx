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
import '../styles/pages/Calendar.css'

const localizer = momentLocalizer(moment)

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [roomEmail, setRoomEmail] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Custom Hooks
  const mobileFilter = useMobileFilter(false)
  const dateFilter = useDateRangeFilter('', '')
  const searchFilter = useSearchFilter(500)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState(null)

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    // Validation: ต้องใส่ Room ID อย่างน้อย
    if (!roomEmail && !dateFilter.startDate && !dateFilter.endDate && !searchFilter.searchQuery) {
      toast.error('Please enter at least one search criteria (Room ID, Event ID, or Date Range)')
      return;
    }

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
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setShowDeleteConfirm(false)
    setLoading(true)
    try {
      await CalendarService.deleteEvent(selectedEvent.id, roomEmail)
      toast.success('Event deleted successfully')
      closeModal()
      await handleSearch()
    } catch (error) {
      console.error("Failed to delete event", error)
      toast.error('Failed to delete event. Please try again.')
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

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Modal */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: 'linear-gradient(145deg, rgba(30, 30, 45, 0.98), rgba(20, 20, 35, 0.98))',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  borderRadius: '20px',
                  padding: '32px',
                  maxWidth: '450px',
                  width: '90%',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
              >
                <h3 style={{
                  color: '#ff6b6b',
                  fontSize: '1.5rem',
                  marginBottom: '16px',
                  fontWeight: 700,
                }}>
                  Delete Event
                </h3>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  marginBottom: '24px',
                  lineHeight: '1.6',
                }}>
                  Are you sure you want to delete <strong style={{ color: '#fff' }}>"{selectedEvent?.title}"</strong>?
                  <br />
                  This action cannot be undone.
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: '12px 24px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={loading}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                      transition: 'all 0.2s',
                      boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
                    }}
                    onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div >
  )
}