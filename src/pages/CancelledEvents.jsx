import { useState, useEffect } from 'react'
import CancelledEventService from '../services/CancelledEventService'
import toast from 'react-hot-toast'
import { Search, Eye, Filter, X } from 'lucide-react'
import { motion } from 'framer-motion'
import dayjs from 'dayjs'
import Loading from '../components/Loading'
import CancelledEventModal from '../components/CancelledEventModal'
import Pagination from '../components/Pagination'
import usePagination from '../hooks/usePagination'
import useMobileFilter from '../hooks/useMobileFilter'
import useDateRangeFilter from '../hooks/useDateRangeFilter'
import useSearchFilter from '../hooks/useSearchFilter'
import './CancelledEvents.css'

export default function CancelledEvents() {
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    // Custom Hooks
    const mobileFilter = useMobileFilter(false)
    const dateFilter = useDateRangeFilter('', '')
    const searchFilter = useSearchFilter(500) // For Event ID search

    // Modal State
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [modalLoading, setModalLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [roomId, setRoomId] = useState('')

    // Pagination Hook
    const pagination = usePagination(transactions, 10)



    // Removed initial useEffect to prevent auto-fetch
    /* useEffect(() => {
        handleSearch()
    }, []) */

    const handleSearch = async (e) => {
        if (e) e.preventDefault()
        setLoading(true)
        setHasSearched(true)
        mobileFilter.close()

        try {
            const payload = {}

            // Only add date filters if they are selected
            if (dateFilter.startDate) {
                payload.startTime = dayjs(dateFilter.startDate).startOf('day').valueOf()
            }
            if (dateFilter.endDate) {
                payload.endTime = dayjs(dateFilter.endDate).endOf('day').valueOf()
            }

            if (searchFilter.searchQuery) {
                payload.eventId = searchFilter.searchQuery
            }

            if (roomId) {
                payload.roomID = roomId
            }

            const response = await CancelledEventService.getCancelledTransactions(payload)
            if (response.success) {
                setTransactions(response.data)
                pagination.resetPagination()

                if (response.data.length > 0) {
                    toast.success(`Found ${response.data.length} cancelled events`)
                } else {
                    toast('No cancelled events found')
                }
            } else {
                setTransactions([])
                toast.error('Failed to fetch data')
            }
        } catch (error) {
            console.error("Failed to fetch cancelled events", error)
            setTransactions([])
            toast.error('Error fetching cancelled events')
        } finally {
            setLoading(false)
        }
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
            toast.error("Failed to load details")
        } finally {
            setModalLoading(false)
        }
    }

    const closeModal = () => {
        setIsModalOpen(false)
        setSelectedEvent(null)
    }

    return (
        <div className="cancelled-events-page">
            {/* Orbs Background */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            {/* Header */}
            <motion.div
                className="cancelled-header-control"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1>Cancelled by MIT</h1>
                    <p>View history of cancelled meeting room reservations</p>
                </div>
            </motion.div>

            {/* Filter Section (Glass Style) */}
            <motion.div
                className="search-bar-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                {/* Mobile Filter Header */}
                <div className="mobile-filter-header" onClick={mobileFilter.toggle}>
                    <span><Search size={16} /> Filters </span>
                    <button type="button" className="icon-btn">
                        {mobileFilter.isOpen ? <X size={20} /> : <Filter size={20} />}
                    </button>
                </div>

                <div className={`search-form-wrapper ${mobileFilter.isOpen ? 'open' : ''}`}>
                    <form onSubmit={handleSearch} className="search-form">
                        <div className="date-group-row">
                            <div className="form-group-inline">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    className="custom-input date-input"
                                    value={dateFilter.startDate}
                                    onChange={(e) => dateFilter.setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    className="custom-input date-input"
                                    value={dateFilter.endDate}
                                    onChange={(e) => dateFilter.setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="form-group-inline">
                            <label>Room ID</label>
                            <input
                                type="text"
                                className="custom-input"
                                placeholder="Search by Room ID..."
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                            />
                        </div>
                        <div className="form-group-inline">
                            <label>Event ID</label>
                            <input
                                type="text"
                                className="custom-input"
                                placeholder="Search by Event ID..."
                                value={searchFilter.searchQuery}
                                onChange={(e) => searchFilter.setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="form-group-inline search-btn-wrapper">
                            <label className="desktop-only-label" style={{ opacity: 0 }}>Search</label>
                            <button type="submit" className="search-btn" disabled={loading}>
                                <Search size={18} /> {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>

            {/* Table Listing */}
            <motion.div
                className="cancelled-events-content-wrapper"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <Loading />
                    </div>
                ) : !hasSearched ? (
                    <div className="no-data">
                        <p>Please select a date range and click Search to view cancelled events.</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="no-data">
                        <p>No cancelled events found in this period.</p>
                    </div>
                ) : (
                    <>
                        <table className="cancelled-table">
                            <thead>
                                <tr>
                                    <th>Event ID</th>
                                    <th>Subject</th>
                                    <th>Room</th>
                                    <th>Event Time</th>
                                    <th>Cancelled At</th>
                                    <th>Detail</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagination.paginatedData.map((t, index) => (
                                    <tr key={t._id || index}>
                                        <td data-label="Event ID">
                                            <div style={{ fontSize: '0.85rem', color: '#a0a0a0', fontFamily: 'monospace' }}>
                                                {t.eventId || '-'}
                                            </div>
                                        </td>
                                        <td data-label="Subject">
                                            <div style={{ fontWeight: 600, color: '#fff' }}>
                                                {t.subject || '-'}
                                            </div>
                                        </td>
                                        <td data-label="Room">
                                            <div style={{ fontWeight: 500 }}>
                                                {t.roomId ? t.roomId.split('@')[0] : '-'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                                {t.roomId}
                                            </div>
                                        </td>
                                        <td data-label="Event Time">
                                            <div style={{ fontSize: '0.9rem' }}>
                                                {dayjs(t.startTime).format('DD MMM YYYY')}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                                {dayjs(t.startTime).format('HH:mm')} - {dayjs(t.endTime).format('HH:mm')}
                                            </div>
                                        </td>
                                        <td data-label="Cancelled At">
                                            {t.time && t.time.unix ? (
                                                <span style={{ fontSize: '0.9rem', color: '#ff7675' }}>
                                                    {dayjs(t.time.unix).format('DD MMM YYYY HH:mm')}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td data-label="Detail" style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {t.detail || '-'}
                                        </td>
                                        <td data-label="Action" style={{ textAlign: 'center' }}>
                                            <button
                                                className="view-btn"
                                                onClick={() => handleViewDetails(t.eventId)}
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

            <CancelledEventModal
                isOpen={isModalOpen}
                onClose={closeModal}
                event={selectedEvent}
                loading={modalLoading}
            />
        </div>
    )
}
