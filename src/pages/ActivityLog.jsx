import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, X } from 'lucide-react'
import toast from 'react-hot-toast'
import ActivityLogService from '../services/ActivityLogService'
import Loading from '../components/Loading'
import useMobileFilter from '../hooks/useMobileFilter'
import Pagination from '../components/Pagination'
import '../styles/pages/ActivityLog.css'

export default function ActivityLog() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1
    })

    // Filter State
    const mobileFilter = useMobileFilter(false)
    const [filters, setFilters] = useState({
        user: '',
        action: '',
        startDate: '',
        endDate: ''
    })

    const fetchLogs = async (page = 1) => {
        setLoading(true)
        try {
            const params = {
                page,
                limit: pagination.limit,
                ...filters
            }

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '') delete params[key]
            })

            const response = await ActivityLogService.getActivityLogs(params)

            if (response.success) {
                setLogs(response.data)
                setPagination(response.pagination)
            } else {
                toast.error('Failed to load activity logs')
            }
        } catch (error) {
            console.error('Error fetching logs:', error)
            toast.error('Error fetching activity logs')
        } finally {
            setLoading(false)
        }
    }

    // Initial load
    useEffect(() => {
        fetchLogs(1)
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        mobileFilter.close()
        fetchLogs(1)
    }

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchLogs(newPage)
        }
    }

    const handleClearFilters = () => {
        setFilters({
            user: '',
            action: '',
            startDate: '',
            endDate: ''
        })
        mobileFilter.close()
        setTimeout(() => fetchLogs(1), 0)
    }

    const formatDate = (dateString) => {
        if (!dateString) return '-'
        return new Date(dateString).toLocaleString('th-TH')
    }

    const getActionBadgeClass = (action) => {
        if (!action) return ''
        const lowerAction = action.toLowerCase()
        if (lowerAction.includes('create') || lowerAction.includes('add')) return 'create'
        if (lowerAction.includes('update') || lowerAction.includes('edit')) return 'update'
        if (lowerAction.includes('delete') || lowerAction.includes('remove') || lowerAction.includes('cancel')) return 'delete'
        if (lowerAction.includes('login')) return 'login'
        if (lowerAction.includes('logout')) return 'logout'
        return ''
    }

    return (
        <div className="activity-log-page">
            {/* Header */}
            <motion.div
                className="activity-log-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Activity Logs</h1>
                <p>Monitor system activities and user actions.</p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
                className="search-bar-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                {/* Mobile Filter Header */}
                <div className="mobile-filter-header" onClick={mobileFilter.toggle}>
                    <span><Search size={16} /> Filters & Search</span>
                    <button type="button" className="icon-btn">
                        {mobileFilter.isOpen ? <X size={20} /> : <Filter size={20} />}
                    </button>
                </div>

                <div className={`search-form-wrapper ${mobileFilter.isOpen ? 'open' : ''}`}>
                    <form className="search-form" onSubmit={handleSearch}>
                        <div className="form-group-inline">
                            <label>Search User (Email, Name)</label>
                            <input
                                type="text"
                                className="custom-input"
                                placeholder="Search by user..."
                                value={filters.user}
                                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                            />
                        </div>

                        <div className="form-group-inline">
                            <label>Action</label>
                            <select
                                className="custom-select"
                                value={filters.action}
                                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            >
                                <option value="">All Actions</option>
                                <option value="create">Create</option>
                                <option value="update">Update</option>
                                <option value="delete">Delete</option>
                            </select>
                        </div>

                        <div className="form-group-inline">
                            <label>Start Date</label>
                            <input
                                type="date"
                                className="custom-input date-input"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>

                        <div className="form-group-inline">
                            <label>End Date</label>
                            <input
                                type="date"
                                className="custom-input date-input"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>

                        <div className="form-group-inline search-btn-wrapper">
                            <label style={{ visibility: 'hidden' }}>Search</label>
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                                <button type="submit" className="search-btn" style={{ flex: 1 }} disabled={loading}>
                                    <Search size={18} /> {loading ? 'Searching...' : 'Search'}
                                </button>

                                {(filters.user || filters.action || filters.startDate || filters.endDate) && (
                                    <button
                                        type="button"
                                        className="search-btn"
                                        style={{ background: 'rgba(255, 255, 255, 0.1)', minWidth: 'auto', padding: '14px', flex: '0 0 auto' }}
                                        onClick={handleClearFilters}
                                        title="Clear filters"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </motion.div>

            {/* Content Table */}
            <motion.div
                className="activity-log-content-wrapper"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                {loading && logs.length === 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <Loading />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="no-data">
                        <p>No activity logs found matching your criteria.</p>
                    </div>
                ) : (
                    <>
                        <div className="table-scroll-container">
                            <table className="activity-log-table">
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log._id}>
                                            <td data-label="Timestamp" style={{ whiteSpace: 'nowrap', width: '180px' }}>
                                                {formatDate(log.timestamp)}
                                            </td>
                                            <td data-label="User">
                                                <div style={{ fontWeight: 500 }}>{log.users || 'System'}</div>
                                            </td>
                                            <td data-label="Action" style={{ width: '120px' }}>
                                                <span className={`action-badge ${getActionBadgeClass(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td data-label="Details" className="details-cell">
                                                {log.detail}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.pages}
                            onPageChange={handlePageChange}
                            itemsPerPage={pagination.limit}
                            totalItems={pagination.total}
                        />
                    </>
                )}
            </motion.div>
        </div>
    )
}
