import { useState, useCallback, useEffect } from 'react'
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import UserEventService from '../services/UserEventService'
import { motion, AnimatePresence } from 'framer-motion'
import Loading from '../components/Loading'
import { Search, X, MapPin, Clock, Users, FileText, User, Box, KeyRound, CalendarPlus, Info, Car, Code, Copy, Check } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './UserEvents.css'

const localizer = momentLocalizer(moment)

export default function UserEvents() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)

    // Search State
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [showDropdown, setShowDropdown] = useState(false)

    const [dateRange, setDateRange] = useState({
        start: moment().startOf('month').format('YYYY-MM-DD'),
        end: moment().endOf('month').format('YYYY-MM-DD')
    })

    const [currentDate, setCurrentDate] = useState(new Date())
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

    // Debounce Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 2 && !selectedUser) {
                try {
                    const res = await UserEventService.searchUsers(searchQuery);
                    if (res.success && res.data) {
                        setSearchResults(res.data);
                        setShowDropdown(true);
                    }
                } catch (error) {
                    console.error("Search error:", error);
                }
            } else {
                setSearchResults([]);
                setShowDropdown(false);
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery, selectedUser])

    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        setSearchQuery(user.email); // Show email or name in input
        setShowDropdown(false);

        // Fetch Events immediately
        fetchEvents(user._id);
    }

    const handleClearSearch = () => {
        setSearchQuery('');
        setSelectedUser(null);
        setEvents([]);
        setSearchResults([]);
    }

    const fetchEvents = async (userId) => {
        setLoading(true)
        try {
            const res = await UserEventService.getUserEvents(userId)

            if (res.success && res.data) {
                const formattedEvents = res.data
                    .filter(item => !item.cancelled)
                    .map(item => ({
                        id: item._id, // Use _id from transaction or event
                        title: item.title || 'Untitled Event',
                        start: new Date(item.startTime.unix),
                        end: new Date(item.endTime.unix),
                        resource: item, // Store full object
                        isCancelled: item.cancelled,
                        location: item.resourceId || 'Unknown Location'
                    }))

                // Sort events by date descending (latest first)
                formattedEvents.sort((a, b) => b.start - a.start)

                setEvents(formattedEvents)

                // Jump to the latest event date if available
                if (formattedEvents.length > 0) {
                    setCurrentDate(formattedEvents[0].start);
                }
            } else {
                setEvents([])
            }
        } catch (error) {
            console.error("Failed to fetch user events", error)
            setEvents([])
        } finally {
            setLoading(false)
        }
    }

    const handleSelectEvent = (event) => {
        setSelectedEvent(event)
    }

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

    return (
        <div className="user-events-page">
            {/* Floating Orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <div className="calendar-header-control">
                <h1>User Events</h1>
                <p>Search for a user to view their scheduled events.</p>
            </div>

            <div className="search-bar-container">
                <div className="search-form">
                    <div className="form-group-inline">
                        <label>Search User (Email, Name)</label>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type="text"
                                placeholder="Type to search..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (selectedUser) setSelectedUser(null);
                                }}
                                className="custom-input"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: '#ccc',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}

                            {/* Dropdown Results */}
                            {showDropdown && searchResults.length > 0 && (
                                <div className="user-dropdown">
                                    {searchResults.map(user => (
                                        <div key={user._id} className="user-item" onClick={() => handleSelectUser(user)}>
                                            <div className="user-avatar-small">
                                                {user.imgUrl ? <img src={user.imgUrl} alt="avatar" /> : user.name.charAt(0)}
                                            </div>
                                            <div className="user-info-text">
                                                <h4>{user.name}</h4>
                                                <p>{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Placeholder for alignment, similar to Calendar search button */}
                    <div className="form-group-inline" style={{ minWidth: 'auto', flex: 'none' }}>
                        <label style={{ opacity: 0 }}>Search</label>
                        <div className="search-btn" style={{ cursor: 'default' }}>
                            <Search size={18} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="user-events-content-wrapper">
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

                {/* --- Events Sidebar List --- */}
                <div className="events-list-sidebar">
                    <div className="events-list-header">
                        User Events
                        <span style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 'normal' }}>
                            {events.length} found
                        </span>
                    </div>

                    {events.length === 0 ? (
                        <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px' }}>
                            No events found.
                        </div>
                    ) : (
                        events.map(event => (
                            <div
                                key={event.id}
                                className="event-list-item"
                                onClick={() => {
                                    setCurrentDate(event.start);
                                    setSelectedEvent(event);
                                }}
                            >
                                <div className="event-list-date">
                                    {moment(event.start).format('DD MMM YYYY')}
                                </div>
                                <div className="event-list-title">
                                    {event.title}
                                </div>
                                <div className="event-list-time">
                                    <Clock size={12} style={{ marginRight: 4 }} />
                                    {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
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
                                                    {moment(selectedEvent.start).format('DD MMM YYYY, HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="detail-item">
                                            <MapPin className="icon" size={20} />
                                            <div>
                                                <label>Location / Resource</label>
                                                <p>{selectedEvent.location}</p>
                                                {selectedEvent.resource.roomType && (
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                                        Type: {selectedEvent.resource.roomType}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Custom Field for Car (Start -> Destination) */}
                                        {selectedEvent.resource.customField && (selectedEvent.resource.customField.start || selectedEvent.resource.customField.destination) && (
                                            <div className="detail-item">
                                                <Car className="icon" size={20} />
                                                <div>
                                                    <label>Route (Car)</label>
                                                    <p>
                                                        {selectedEvent.resource.customField.start || '?'} <span style={{ color: '#a29bfe' }}>➜</span> {selectedEvent.resource.customField.destination || '?'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="detail-item">
                                            <User className="icon" size={20} />
                                            <div>
                                                <label>Owner</label>
                                                <p>{selectedEvent.resource.owner}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            {selectedEvent.resource.checkInPin && (
                                                <div className="detail-item">
                                                    <KeyRound className="icon" size={20} />
                                                    <div>
                                                        <label>Check-in PIN</label>
                                                        <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#55efc4' }}>
                                                            {selectedEvent.resource.checkInPin}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedEvent.resource.objectiveId && (
                                                <div className="detail-item">
                                                    <Info className="icon" size={20} />
                                                    <div>
                                                        <label>Objective ID</label>
                                                        <p>{selectedEvent.resource.objectiveId}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {selectedEvent.resource.attendees && selectedEvent.resource.attendees.length > 0 && (
                                            <div className="detail-item">
                                                <Users className="icon" size={20} />
                                                <div>
                                                    <label>Attendees</label>
                                                    <p>{selectedEvent.resource.attendees.length} people</p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="detail-item">
                                            <CalendarPlus className="icon" size={20} />
                                            <div>
                                                <label>Created At</label>
                                                <p>{moment(selectedEvent.resource.createdTime).format('DD MMM YYYY, HH:mm:ss')}</p>
                                            </div>
                                        </div>

                                        {/* --- Transaction Timeline --- */}
                                        {selectedEvent.resource.transactions && selectedEvent.resource.transactions.length > 0 && (
                                            <div className="transaction-section">
                                                <h3>History</h3>
                                                <div className="timeline">
                                                    {[...selectedEvent.resource.transactions]
                                                        .sort((a, b) => (b.time?.unix || 0) - (a.time?.unix || 0)) // Sort desc
                                                        .map((trans, index) => (
                                                            <div key={trans._id || index} className="timeline-item">
                                                                <div className={`timeline-dot ${trans.action}`} />
                                                                <div className="timeline-content">
                                                                    <div className="timeline-action">
                                                                        {trans.action} by User
                                                                    </div>
                                                                    <div className="timeline-date">
                                                                        <Clock size={12} />
                                                                        <span>
                                                                            {trans.time?.day}/{trans.time?.month}/{trans.time?.year} {String(trans.time?.hour).padStart(2, '0')}.{String(trans.time?.minute).padStart(2, '0')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
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
                                <div />
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

