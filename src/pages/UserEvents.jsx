import { useState } from 'react'
import moment from 'moment'
import UserEventService from '../services/UserEventService'
import { motion } from 'framer-motion'
import Loading from '../components/Loading'
import toast from 'react-hot-toast'
import { Search, X, Eye, Filter } from 'lucide-react'
import UserEventModal from '../components/UserEventModal'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import useMobileFilter from '../hooks/useMobileFilter'
import useDateRangeFilter from '../hooks/useDateRangeFilter'
import useUserSearch from '../hooks/useUserSearch'
import './UserEvents.css'

export default function UserEvents() {
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)

    // Custom Hooks
    const userSearch = useUserSearch(UserEventService)
    const mobileFilter = useMobileFilter(false)
    const dateFilter = useDateRangeFilter('', '')

    // Filter State
    const [eventId, setEventId] = useState('')
    const [resourceId, setResourceId] = useState('')

    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedEvent, setSelectedEvent] = useState(null)

    // Filter events by event ID before pagination
    const filteredEvents = events.filter(event =>
        !eventId || event.id?.toLowerCase().includes(eventId.toLowerCase())
    )

    // Pagination Hook
    const pagination = usePagination(filteredEvents, 10)



    const handleSearch = () => {
        if (!eventId && !userSearch.selectedUser && !resourceId && !dateFilter.startDate && !dateFilter.endDate) {
            toast.error('Please select at least one filter')
            return
        }
        mobileFilter.close()
        fetchEvents()
    }

    const handleClearSearch = () => {
        userSearch.handleClearSearch()
        setEvents([])
        setEventId('')
        setResourceId('')
        dateFilter.resetDates()
        mobileFilter.open()
    }

    const fetchEvents = async () => {
        if (!eventId && !userSearch.selectedUser && !resourceId && !dateFilter.startDate && !dateFilter.endDate) {
            toast.error('Please select at least one filter (Event ID, User, Resource, or Date Range)')
            return
        }

        setLoading(true)

        try {
            // สร้าง filters object
            const filters = {}

            if (eventId) {
                filters.eventId = eventId
            }

            if (userSearch.selectedUser) {
                filters.userId = userSearch.selectedUser._id
            }

            if (resourceId) {
                filters.resourceId = resourceId
            }

            if (dateFilter.startDate) {
                filters.startDate = moment(dateFilter.startDate).startOf('day').valueOf()
            }

            if (dateFilter.endDate) {
                filters.endDate = moment(dateFilter.endDate).endOf('day').valueOf()
            }

            const res = await UserEventService.getUserEvents(filters)

            if (res.success && res.data) {
                const formattedEvents = res.data
                    .map(item => ({
                        id: item._id,
                        title: item.title || 'Untitled Event',
                        start: new Date(item.startTime.unix),
                        end: new Date(item.endTime.unix),
                        resource: item,
                        isCancelled: item.cancelled,
                        location: item.resourceId || 'Unknown Location'
                    }))

                // Sort events by date descending (latest first)
                formattedEvents.sort((a, b) => b.start - a.start)

                setEvents(formattedEvents)

                // Reset pagination to first page
                pagination.resetPagination()

                // Jump to the latest event date if available
                if (formattedEvents.length > 0) {
                    setCurrentDate(formattedEvents[0].start);
                    toast.success(`Found ${formattedEvents.length} events`)
                } else {
                    toast('No events found')
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

    const handleEventUpdate = (updatedEventData) => {
        // Format the updated event to match the structure used in the list
        // Defensive coding for date handling (supporting both .unix object and direct timestamp/string)
        const getTimestamp = (val) => {
            if (!val) return null
            if (typeof val === 'object' && val.unix) return new Date(val.unix) // Existing format
            if (typeof val === 'number') return new Date(val) // Direct timestamp
            return new Date(val) // ISO string or other
        }

        const formattedUpdatedEvent = {
            id: updatedEventData._id,
            title: updatedEventData.title || 'Untitled Event',
            start: getTimestamp(updatedEventData.startTime),
            end: getTimestamp(updatedEventData.endTime),
            resource: updatedEventData, // Keep raw doc
            isCancelled: updatedEventData.cancelled,
            location: updatedEventData.resourceId || 'Unknown Location'
        }

        // 1. Update the list state
        setEvents(prevEvents => prevEvents.map(event =>
            event.id === formattedUpdatedEvent.id ? formattedUpdatedEvent : event
        ))

        // 2. Update the selected event state to reflect changes immediately in the modal
        setSelectedEvent(formattedUpdatedEvent)
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
                <h1>Events</h1>
                <p>Search for a user to view their scheduled events.</p>
            </motion.div>

            <motion.div
                className="search-bar-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                {/* Mobile Filter Header */}
                <div className="mobile-filter-header" onClick={mobileFilter.toggle}>
                    <span><Search size={16} /> Search User</span>
                    <button type="button" className="icon-btn">
                        {mobileFilter.isOpen ? <X size={20} /> : <Filter size={20} />}
                    </button>
                </div>

                <div className={`search-form-wrapper ${mobileFilter.isOpen ? 'open' : ''}`}>
                    <div className="search-form">
                        <div className="form-group-inline">
                            <label>Search User (Email, Name)</label>
                            <div style={{ position: 'relative', width: '100%' }}>
                                <input
                                    type="text"
                                    placeholder="Search by User..."
                                    value={userSearch.searchQuery}
                                    onChange={(e) => {
                                        userSearch.setSearchQuery(e.target.value)
                                        if (userSearch.selectedUser) userSearch.setSelectedUser(null)
                                    }}
                                    className="custom-input"
                                    style={{ paddingRight: userSearch.searchQuery ? '45px' : '18px' }}
                                />
                                {userSearch.searchQuery && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="clear-search-btn"
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: 'rgba(255, 255, 255, 0.6)',
                                            cursor: 'pointer',
                                            padding: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)'
                                            e.currentTarget.style.color = '#ff6b6b'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                                            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                                        }}
                                    >
                                        <X size={14} />
                                    </button>
                                )}

                                {/* Dropdown Results */}
                                {userSearch.showDropdown && userSearch.searchResults.length > 0 && (
                                    <div className="user-dropdown">
                                        {userSearch.searchResults.map(user => (
                                            <div key={user._id} className="user-item" onClick={() => userSearch.handleSelectUser(user)}>
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

                        <div className="form-group-inline">
                            <label>Event ID</label>
                            <input
                                type="text"
                                placeholder="Search by Event ID..."
                                value={eventId}
                                onChange={(e) => setEventId(e.target.value)}
                                className="custom-input"
                            />
                        </div>

                        <div className="form-group-inline">
                            <label>Room ID</label>
                            <input
                                type="text"
                                placeholder="Search by Room ID..."
                                value={resourceId}
                                onChange={(e) => setResourceId(e.target.value)}
                                className="custom-input"
                            />
                        </div>

                        {/* Search Button - Top Right */}
                        <div className="form-group-inline search-btn-wrapper">
                            <label className="desktop-only-label" style={{ opacity: 0 }}>Search</label>
                            <button
                                className="search-btn"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                <Search size={18} /> {loading ? '...' : 'Search'}
                            </button>
                        </div>

                        {/* Flex Break - Force date row to new line */}
                        <div className="flex-break"></div>

                        {/* Date Range Row */}
                        <div className="date-group-row">
                            <div className="form-group-inline">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    value={dateFilter.startDate}
                                    onChange={(e) => dateFilter.setStartDate(e.target.value)}
                                    className="custom-input date-input"
                                />
                            </div>
                            <div className="form-group-inline">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    value={dateFilter.endDate}
                                    onChange={(e) => dateFilter.setEndDate(e.target.value)}
                                    className="custom-input date-input"
                                />
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', width: '100%' }}>
                        <Loading />
                    </div>
                ) : events.length === 0 ? (
                    <div className="no-data">
                        <p>{!eventId && !userSearch.selectedUser && !resourceId && !dateFilter.startDate && !dateFilter.endDate
                            ? 'Search for events using filters above.'
                            : 'No events found with the selected filters.'}</p>
                    </div>
                ) : (
                    <>
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
                                {pagination.paginatedData.map((event, index) => (
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
                                            <div style={{ fontWeight: 500 }}>
                                                {event.resource?.resourceName || event.resource?.resourceId || event.location}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                                {event.resource?.roomType || ''}
                                            </div>
                                        </td>
                                        <td data-label="Event Time">
                                            <div style={{ fontSize: '0.9rem' }}>
                                                {event.start ? new Date(event.start).toLocaleDateString('en-GB') : '-'}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                                {event.start && event.end
                                                    ? `${new Date(event.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                                                    : '-'}
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

                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={pagination.handlePageChange}
                            itemsPerPage={pagination.itemsPerPage}
                            totalItems={pagination.totalItems}
                        />
                    </>
                )}
            </motion.div>

            <UserEventModal
                isOpen={!!selectedEvent}
                event={selectedEvent}
                onClose={closeModal}
                onUpdate={handleEventUpdate}
            />
        </div>
    )
}
