import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, X } from 'lucide-react'
import toast from 'react-hot-toast'
import ActivityLogService from '../services/ActivityLogService'
import Loading from '../components/Loading'
import useMobileFilter from '../hooks/useMobileFilter'
import useSessionState from '../hooks/useSessionState'
import Pagination from '../components/Pagination'
import InfoTooltip from '../components/InfoTooltip'
import '../styles/pages/shared.css'
import '../styles/pages/ActivityLog.css'


export default function ActivityLog() {
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(false)

    const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
    const minDate = useMemo(() => new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), [])
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        pages: 1
    })

    // Filter State
    const mobileFilter = useMobileFilter()
    const [filters, setFilters] = useSessionState('activityLog_filters', {
        user: '',
        action: '',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: ''
    })

    // Auto-search on mount if filters have values
    useEffect(() => {
        if (filters.user || filters.action || filters.startDate || filters.endDate) {
            fetchLogs()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchLogs = async (page = 1, overrideFilters = null) => {
        setLoading(true)
        try {
            const activeFilters = overrideFilters !== null ? overrideFilters : filters
            const params = {
                page,
                limit: pagination.limit,
                ...activeFilters
            }

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (params[key] === '') delete params[key]
            })

            const response = await ActivityLogService.getActivityLogs(params)

            if (response.success) {
                setLogs(response.data)
                setPagination(prev => ({ ...prev, ...response.pagination }))
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
        const cleared = { user: '', action: '', startDate: '', endDate: '' }
        setFilters(cleared)
        setLogs([])
        mobileFilter.open()
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
            <motion.div
                className="activity-log-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1>Activity Logs</h1>
                    <InfoTooltip
                        title="About Activity Logs"
                        content={
                            <>
                                <p>This page displays a history of user actions across the system. Data is fetched using the following logic:</p>
                                <ul>
                                    <li><strong>Data Source:</strong> <code>meetingtoolsactivitylog</code> collection</li>
                                    <li><strong>User Info:</strong> Real-time lookup using the user's email to fetch their current <code>firstName</code>, <code>lastName</code>, or <code>displayName</code> directly from the <code>meetingtoolusers</code> collection.</li>
                                    <li><strong>Date Limit:</strong> For performance, queries are strictly clamped to a maximum of <strong>90 days</strong> from the current date.</li>
                                    <li><strong>Pagination:</strong> Data is loaded in chunks (20 per page) to ensure fast rendering.</li>
                                </ul>
                            </>
                        }
                    />
                </div>
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
                                min={minDate}
                                max={today}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            />
                        </div>

                        <div className="form-group-inline">
                            <label>End Date</label>
                            <input
                                type="date"
                                className="custom-input date-input"
                                value={filters.endDate}
                                min={minDate}
                                max={today}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            />
                        </div>

                        <div className="form-group-inline search-btn-wrapper">
                            <label className="desktop-only-label" style={{ opacity: 0 }}>Search</label>
                            <button type="submit" className="search-btn" disabled={loading}>
                                <Search size={18} /> {loading ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        {(filters.user || filters.action || filters.startDate || filters.endDate || logs.length > 0) && (
                            <div className="form-group-inline search-btn-wrapper">
                                <label className="desktop-only-label" style={{ opacity: 0 }}>Clear</label>
                                <button
                                    type="button"
                                    className="search-btn"
                                    style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'none' }}
                                    onClick={handleClearFilters}
                                >
                                    <X size={18} /> Clear
                                </button>
                            </div>
                        )}
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
                                                {log.users && log.users !== 'System' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 600, color: '#f8f9fa' }}>
                                                            {log.firstName ? `${log.firstName} ${log.lastName || ''}`.trim() : log.displayName || log.users.split('@')[0]}
                                                        </span>
                                                        <span style={{ fontSize: '0.85em', color: '#a0a0b0' }}>
                                                            {log.users}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div style={{ fontWeight: 500 }}>System</div>
                                                )}
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
        </div >
    )
}
