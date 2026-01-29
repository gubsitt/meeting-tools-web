import { useState, useCallback } from 'react'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import CalendarService from '../services/CalendarService'
import { motion, AnimatePresence } from 'framer-motion'
import Loading from '../components/Loading'
// ✅ รวม Import ไว้ในบรรทัดเดียว (มี Trash2 เรียบร้อย)
import toast from 'react-hot-toast'
import { Search, X, MapPin, Clock, Users, FileText, Trash2, Code, Copy, Check } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './Calendar.css'

const localizer = momentLocalizer(moment)

export default function Calendar() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [roomEmail, setRoomEmail] = useState('dev365.room1@exzydev.onmicrosoft.com')

  const [dateRange, setDateRange] = useState({
    start: moment().startOf('month').format('YYYY-MM-DD'),
    end: moment().endOf('month').format('YYYY-MM-DD')
  })

  const [currentDate, setCurrentDate] = useState(new Date())

  // State สำหรับเก็บ Event ที่ถูกกดเลือก
  const [selectedEvent, setSelectedEvent] = useState(null)

  // State for Modal View Mode (Detail vs JSON)
  const [viewMode, setViewMode] = useState('detail')
  const [copied, setCopied] = useState(false)

  const handleCopyJson = () => {
    if (!selectedEvent) return
    const jsonString = JSON.stringify(selectedEvent.resource, null, 2)
    navigator.clipboard.writeText(jsonString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!roomEmail) return;

    setLoading(true)
    try {
      // ... existing imports

      const res = await CalendarService.getEvents(roomEmail, dateRange.start, dateRange.end)

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
        setCurrentDate(new Date(dateRange.start))

        if (formattedEvents.length > 0) {
          toast.success(`Found ${formattedEvents.length} events`)
        } else {
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
    setViewMode('detail')
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

      <div className="calendar-header-control">
        <div> {/* เปลี่ยนจาก motion.div เป็น div ธรรมดา */}
          <h1>Meeting Schedule</h1>
          <p>Search room availability</p>
        </div>
      </div>

      <div className="search-bar-container"> {/* เปลี่ยนจาก motion.div เป็น div ธรรมดา */}
        <form onSubmit={handleSearch} className="search-form">
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
      </div >

      <div className="calendar-wrapper">
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
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="event-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className="event-modal-content"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="modal-header">
                <div>
                  <h2>{selectedEvent.title}</h2>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => setViewMode('detail')}
                      style={{
                        background: viewMode === 'detail' ? 'rgba(108, 92, 231, 0.3)' : 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setViewMode('json')}
                      style={{
                        background: viewMode === 'json' ? 'rgba(108, 92, 231, 0.3)' : 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Code size={14} /> JSON
                    </button>
                  </div>
                </div>
                <button className="close-btn" onClick={closeModal}>
                  <X size={24} />
                </button>
              </div>

              {/* Body */}
              <div className="modal-body">
                {viewMode === 'detail' ? (
                  <>
                    <div className="detail-item">
                      <Clock className="icon" size={20} />
                      <div>
                        <label>Time</label>
                        <p>
                          {moment(selectedEvent.start).format('DD MMM YYYY, HH:mm')} -
                          {moment(selectedEvent.end).format('HH:mm')}
                        </p>
                      </div>
                    </div>

                    <div className="detail-item">
                      <MapPin className="icon" size={20} />
                      <div>
                        <label>Location</label>
                        <p>{selectedEvent.resource?.location?.displayName || roomEmail}</p>
                      </div>
                    </div>

                    {selectedEvent.resource?.bodyPreview && (
                      <div className="detail-item">
                        <FileText className="icon" size={20} />
                        <div>
                          <label>Description</label>
                          <p className="description-text">{selectedEvent.resource.bodyPreview}</p>
                        </div>
                      </div>
                    )}

                    <div className="detail-item">
                      <Users className="icon" size={20} />
                      <div>
                        <label>Organizer</label>
                        <p>{selectedEvent.resource?.organizer?.emailAddress?.name || 'Unknown'}</p>
                        <span className="email-sub">
                          {selectedEvent.resource?.organizer?.emailAddress?.address}
                        </span>
                      </div>
                    </div>
                    {/* Attendees Section */}
                    {selectedEvent.resource?.attendees && selectedEvent.resource?.attendees.length > 0 && (
                      <div className="detail-item" style={{ alignItems: 'flex-start' }}>
                        <div className="icon" style={{ marginTop: 2 }}>
                          <Users size={20} />
                        </div>
                        <div style={{ width: '100%' }}>
                          <label>Attendees ({selectedEvent.resource.attendees.length})</label>
                          <div className="attendees-list" style={{ marginTop: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                            {selectedEvent.resource.attendees.map((attendee, index) => (
                              <div key={index} style={{ marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                                <p style={{ fontSize: '0.9rem', marginBottom: '2px' }}>{attendee.emailAddress?.name || 'Unknown'}</p>
                                <span className="email-sub" style={{ fontSize: '0.8rem' }}>
                                  {attendee.emailAddress?.address}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={handleCopyJson}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: 'white',
                        padding: '6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {copied ? <Check size={16} color="#55efc4" /> : <Copy size={16} />}
                      {copied && <span style={{ fontSize: '0.8rem', color: '#55efc4' }}>Copied!</span>}
                    </button>
                    <pre style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      padding: '16px',
                      borderRadius: '12px',
                      overflowX: 'auto',
                      color: '#a29bfe',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      maxHeight: '400px'
                    }}>
                      {JSON.stringify(selectedEvent.resource, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="modal-footer">
                {!selectedEvent.isCancelled && (
                  <button className="delete-btn" onClick={handleDelete} disabled={loading}>
                    <Trash2 size={16} /> Delete
                  </button>
                )}
                <span className={`status-badge ${selectedEvent.isCancelled ? 'cancelled' : 'active'}`}>
                  {selectedEvent.isCancelled ? 'Cancelled' : 'Scheduled'}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div >
  )
}