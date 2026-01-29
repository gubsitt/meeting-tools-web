import { useState, useEffect } from 'react'
import CancelledEventService from '../services/CancelledEventService'
import toast from 'react-hot-toast'
import { Search, Calendar as CalendarIcon, User, Mail, Info, X, ExternalLink, Clock, MapPin, FileText, Users, Eye } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import dayjs from 'dayjs'
import Loading from '../components/Loading'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './CancelledEvents.css'

const localizer = momentLocalizer(moment)

export default function CancelledEvents() {
    const [transactions, setTransactions] = useState([])
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)
    const [currentDate, setCurrentDate] = useState(new Date())

    // Filter State
    const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
    const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'))

    // Modal State
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [modalLoading, setModalLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        // Initial fetch
        handleSearch()
    }, [])

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        try {
            const startTimestamp = dayjs(startDate).startOf('day').valueOf()
            const endTimestamp = dayjs(endDate).endOf('day').valueOf()

            // ... existing imports

            const response = await CancelledEventService.getCancelledTransactions(startTimestamp, endTimestamp)
            if (response.success) {
                setTransactions(response.data)
                // Map to Calendar Events
                const mappedEvents = response.data.map(t => ({
                    id: t.eventId,
                    title: `Cancelled: ${t.roomId.split('@')[0]}`,
                    start: new Date(t.startTime),
                    end: new Date(t.endTime),
                    resource: t
                }))
                setEvents(mappedEvents)

                // Jump to the first event's date if exists
                if (mappedEvents.length > 0) {
                    // Sort to find the absolute earliest
                    const sortedEvents = [...mappedEvents].sort((a, b) => a.start - b.start)
                    setCurrentDate(sortedEvents[0].start)
                    toast.success(`Found ${mappedEvents.length} cancelled events`)
                } else {
                    setCurrentDate(new Date(startDate))
                    toast('No cancelled events found')
                }
            } else {
                setEvents([])
                toast.error('Failed to fetch data')
            }
        } catch (error) {
            console.error("Failed to fetch cancelled events", error)
            setEvents([])
            toast.error('Error fetching cancelled events')
        } finally {
            setLoading(false)
        }
    }

    const handleSelectEvent = (event) => {
        handleViewDetails(event.id)
    }

    const handleViewDetails = async (eventId) => {
        setIsModalOpen(true)
        setModalLoading(true)
        setSelectedEvent(null)
        try {
            const response = await CancelledEventService.getEventOwner(eventId)
            if (response.success) {
                setSelectedEvent(response.data)
            }
        } catch (error) {
            console.error("Failed to fetch event details", error)
        } finally {
            setModalLoading(false)
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedEvent(null)
    }

    const eventStyleGetter = (event) => {
        return {
            style: {
                backgroundColor: 'rgba(255, 107, 107, 0.2)', // Red background
                color: '#ff6b6b',
                border: '1px solid #ff6b6b',
                borderRadius: '6px',
                display: 'block',
                textDecoration: 'line-through'
            }
        }
    }

    return (
        <div className="cancelled-events-page">
            {/* Orbs Background */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            {/* Header */}
            <div className="cancelled-header-control">
                <div>
                    <h1>Cancelled History</h1>
                    <p>View history of cancelled meeting room reservations</p>
                </div>
            </div>

            {/* Filter Section (Glass Style) */}
            <div className="search-bar-container">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="form-group-inline">
                        <label>Start Date</label>
                        <input
                            type="date"
                            className="custom-input date-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group-inline">
                        <label>End Date</label>
                        <input
                            type="date"
                            className="custom-input date-input"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="form-group-inline" style={{ minWidth: 'auto', flex: 'none' }}>
                        <label style={{ opacity: 0 }}>Search</label>
                        <button type="submit" className="search-btn" disabled={loading}>
                            <Search size={18} /> {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Calendar Wrapper */}
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
                    onSelectEvent={handleSelectEvent}
                    popup
                />
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
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
                            <div className="modal-header">
                                <h2>Cancelled Event Details</h2>
                                <button className="close-btn" onClick={closeModal}>
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="modal-body">
                                {modalLoading ? (
                                    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Loading />
                                    </div>
                                ) : selectedEvent ? (
                                    <>
                                        {/* Event Info */}
                                        <div className="detail-item">
                                            <Clock className="icon" size={20} />
                                            <div>
                                                <label>Subject</label>
                                                <p>{selectedEvent.event.title}</p>
                                            </div>
                                        </div>

                                        <div className="detail-item">
                                            <MapPin className="icon" size={20} />
                                            <div>
                                                <label>Room</label>
                                                <p>{selectedEvent.event.resourceId}</p>
                                            </div>
                                        </div>

                                        <div className="detail-item">
                                            <CalendarIcon className="icon" size={20} />
                                            <div>
                                                <label>Original Time</label>
                                                <p>
                                                    {dayjs(selectedEvent.event.startTime.unix).format('DD MMM YYYY, HH:mm')} -
                                                    {dayjs(selectedEvent.event.endTime.unix).format('HH:mm')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Owner Info */}
                                        <div className="detail-item">
                                            <User className="icon" size={20} />
                                            <div>
                                                <label>Booked By</label>
                                                {selectedEvent.owner ? (
                                                    <>
                                                        <p>{selectedEvent.owner.name} ({selectedEvent.owner.initial})</p>
                                                        <span className="email-sub">{selectedEvent.owner.email}</span>
                                                    </>
                                                ) : (
                                                    <p style={{ color: '#ff7675' }}>Owner profile not found</p>
                                                )}
                                            </div>
                                        </div>

                                        {selectedEvent.owner?.division && (
                                            <div className="detail-item">
                                                <Users className="icon" size={20} />
                                                <div>
                                                    <label>Division</label>
                                                    <p>{selectedEvent.owner.division}</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', color: '#ff7675' }}>
                                        Failed to load event details.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
