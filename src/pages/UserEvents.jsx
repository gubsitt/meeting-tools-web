import { useState, useEffect } from 'react'
import moment from 'moment'
import UserEventService from '../services/UserEventService'
import { motion } from 'framer-motion'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'
import { Search, X, Eye, Filter } from 'lucide-react'
import UserEventModal from '../components/UserEventModal'
import './UserEvents.css'

export default function UserEvents() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)

    // Search State
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [showDropdown, setShowDropdown] = useState(false)
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)
    const [searchEventId, setSearchEventId] = useState('')

    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedEvent, setSelectedEvent] = useState(null)

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
        setIsMobileFilterOpen(false); // ปิด filter บนมือถือ

        // Fetch Events immediately
        fetchEvents(user._id);
    }

    const handleClearSearch = () => {
        setSearchQuery('');
        setSelectedUser(null);
        setEvents([]);
        setSearchResults([]);
        setIsMobileFilterOpen(true); // เปิด filter กลับมาเมื่อ clear
    }

    const fetchEvents = async (userId) => {
        setLoading(true)
        // ... existing imports

        try {
            const res = await UserEventService.getUserEvents(userId)

            if (res.success && res.data) {
                const formattedEvents = res.data
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
                    toast.success(`Found ${formattedEvents.length} events`)
                } else {
                    toast('No events found for this user')
                }
            } else {
                setEvents([])
                toast.error('No data returned')
            }
        } catch (error) {
            console.error("Failed to fetch user events", error)
            setEvents([])
            toast.error('Failed to fetch user events')
        } finally {
            setLoading(false)
        }
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

    return (
        <div className="user-events-page">
            {/* Floating Orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <motion.div
                className="calendar-header-control"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>User Events</h1>
                <p>Search for a user to view their scheduled events.</p>
            </motion.div>

            <motion.div
                className="search-bar-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                {/* Mobile Filter Header */}
                <div className="mobile-filter-header" onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}>
                    <span><Search size={16} /> Search User</span>
                    <button type="button" className="icon-btn">
                        {isMobileFilterOpen ? <X size={20} /> : <Filter size={20} />}
                    </button>
                </div>

                <div className={`search-form-wrapper ${isMobileFilterOpen ? 'open' : ''}`}>
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
                        <div className="form-group-inline" style={{ marginTop: '10px' }}>
                            <label>Event ID (Optional)</label>
                            <input
                                type="text"
                                placeholder="Filter by Event ID..."
                                value={searchEventId}
                                onChange={(e) => setSearchEventId(e.target.value)}
                                className="custom-input"
                            />
                        </div>
                        {/* Placeholder for alignment, similar to Calendar search button */}
                        <div className="form-group-inline" style={{ minWidth: 'auto', flex: 'none' }}>
                            <label className="desktop-only-label" style={{ opacity: 0 }}>Search</label>
                            <div className="search-btn" style={{ cursor: 'default' }}>
                                <Search size={18} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Table Listing */}
            <motion.div
                className="user-events-content-wrapper"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <Loading />
                    </div>
                ) : !selectedUser ? (
                    <div className="no-data">
                        <p>Search for a user to see their event history.</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="no-data">
                        <p>No events found for {selectedUser.name}.</p>
                    </div>
                ) : (
                    <table className="user-events-table">
                        <thead>
                            <tr>
                                <th>Event ID</th>
                                <th>Subject</th>
                                <th>Room / Location</th>
                                <th>Event Time</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.filter(event => !searchEventId || event.id?.toLowerCase().includes(searchEventId.toLowerCase())).map((event, index) => (
                                <tr key={event.id || index}>
                                    <td data-label="Event ID">
                                        <div style={{ fontSize: '0.85rem', color: '#a0a0a0', fontFamily: 'monospace' }}>
                                            {event.id || '-'}
                                        </div>
                                    </td>
                                    <td data-label="Subject">
                                        <div style={{ fontWeight: 600, color: '#fff' }}>
                                            {event.title}
                                        </div>
                                    </td>
                                    <td data-label="Room / Location">
                                        {event.resource.resourceName && (
                                            <div style={{ fontWeight: 600, color: '#fff' }}>
                                                {event.resource.resourceName}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                            {event.location}
                                        </div>
                                    </td>
                                    <td data-label="Time">
                                        <div style={{ fontSize: '0.9rem' }}>
                                            {moment(event.start).format('DD MMM YYYY')}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                            {moment(event.start).format('HH:mm')} - {moment(event.end).format('HH:mm')}
                                        </div>
                                    </td>
                                    <td data-label="Status" style={{ textAlign: 'center' }}>
                                        <span className={`status-badge ${event.isCancelled ? 'cancelled' : 'active'}`}>
                                            {event.isCancelled ? 'Cancelled' : 'Scheduled'}
                                        </span>
                                    </td>
                                    <td data-label="Action" style={{ textAlign: 'center' }}>
                                        <button
                                            className="view-btn"
                                            onClick={() => setSelectedEvent(event)}
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </motion.div>

            <UserEventModal
                isOpen={!!selectedEvent}
                event={selectedEvent}
                onClose={closeModal}
            />
        </div>
    )
}
