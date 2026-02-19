import React, { useState, useRef, useEffect } from 'react';
import MissSyncService from '../services/MissSyncService';
import { Search, RefreshCw, AlertCircle, Smartphone, Globe, Filter, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import Pagination from '../components/Pagination';
import usePagination from '../hooks/usePagination';
import useMobileFilter from '../hooks/useMobileFilter';
import useDateRangeFilter from '../hooks/useDateRangeFilter';
import useSearchFilter from '../hooks/useSearchFilter';
import '../styles/pages/MissSyncEvents.css';

const MissSyncEvents = () => {

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // New State for Room ID
    const [roomId, setRoomId] = useState('');

    // Custom Hooks
    const mobileFilter = useMobileFilter(false);
    const dateFilter = useDateRangeFilter('', '');
    const searchFilter = useSearchFilter(500); // For Event ID search

    const [syncingEventId, setSyncingEventId] = useState(null);
    const [syncAlert, setSyncAlert] = useState(null);
    const alertTimeoutRef = useRef(null);

    // Pagination Hook - Use 'events' directly as filtering is now server-side
    const pagination = usePagination(events, 10);

    // Clear timeout when component unmounts
    useEffect(() => {
        return () => {
            if (alertTimeoutRef.current) {
                clearTimeout(alertTimeoutRef.current);
            }
        };
    }, []);

    const fetchEvents = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setHasSearched(true);
        mobileFilter.close();

        try {
            const payload = {};

            // Add date filters if selected
            if (dateFilter.startDate) {
                payload.startDate = moment(dateFilter.startDate).startOf('day').toISOString();
            }
            if (dateFilter.endDate) {
                payload.endDate = moment(dateFilter.endDate).endOf('day').toISOString();
            }

            // Add other filters
            if (searchFilter.searchQuery) {
                payload.eventId = searchFilter.searchQuery;
            }
            if (roomId) {
                payload.roomId = roomId;
            }

            const response = await MissSyncService.getMissSyncEvents(payload);

            if (response.success) {
                // Filter out cancelled events (if needed, though backend logically shouldn't return them if we trust the API, but keeping as safeguard or per requirement)
                // The user's backend code snippet doesn't explicitly filter out cancelled events in the query, so keeping this check is safe.
                const activeEvents = response.data.filter(event =>
                    !event.title?.startsWith('Canceled:') && !event.isCancelled
                );
                setEvents(activeEvents);
                pagination.resetPagination();

                if (activeEvents.length > 0) {
                    toast.success(`Found ${activeEvents.length} events`);
                } else {
                    toast('No miss sync events found');
                }
            }
        } catch (error) {
            toast.error('Failed to fetch data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const syncEvent = async (eventId) => {
        setSyncingEventId(eventId);

        // Clear any existing timeout
        if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current);
        }

        try {
            const response = await MissSyncService.syncMissingSyncIds(eventId);

            // Check if sync was successful (response.data.success or response.success)
            const isSuccess = response.data?.success || response.success;
            const syncData = response.data || response;

            if (isSuccess) {
                // Show success alert
                const updatedFields = syncData.updated ? Object.keys(syncData.updated) : [];
                setSyncAlert({
                    type: 'success',
                    message: 'Sync completed successfully!',
                    details: updatedFields.length > 0 ? `Updated: ${updatedFields.join(', ')}` : null
                });

                // Auto hide after 8 seconds
                alertTimeoutRef.current = setTimeout(() => {
                    setSyncAlert(null);
                    alertTimeoutRef.current = null;
                }, 8000);

                // Update event in the list
                if (syncData.updated) {
                    setEvents(prevEvents =>
                        prevEvents.map(e => {
                            if (e._id === eventId) {
                                return {
                                    ...e,
                                    globalSyncId: syncData.updated.globalSyncId || e.globalSyncId,
                                    resourceSyncId: syncData.updated.resourceSyncId || e.resourceSyncId,
                                    syncId: syncData.updated.syncId || e.syncId
                                };
                            }
                            return e;
                        })
                    );
                }

            } else {
                // Show error alert
                const errors = syncData.errors || [];
                const errorMsg = errors.length > 0 ? errors.join(' | ') : (response.message || 'Sync failed');
                setSyncAlert({
                    type: 'error',
                    message: 'Sync failed!',
                    details: errorMsg
                });

                // Auto hide after 10 seconds for errors
                alertTimeoutRef.current = setTimeout(() => {
                    setSyncAlert(null);
                    alertTimeoutRef.current = null;
                }, 10000);
            }
        } catch (error) {
            // Show error alert
            const errorData = error.response?.data?.data || error.response?.data;
            const errorMessages = errorData?.errors || [error.response?.data?.message || error.message || 'Unknown error'];
            const errorMsg = Array.isArray(errorMessages) ? errorMessages.join(' | ') : errorMessages;

            setSyncAlert({
                type: 'error',
                message: 'Sync failed!',
                details: errorMsg
            });

            // Auto hide after 10 seconds for errors
            alertTimeoutRef.current = setTimeout(() => {
                setSyncAlert(null);
                alertTimeoutRef.current = null;
            }, 10000);

            console.error(error);
        } finally {
            setSyncingEventId(null);
        }
    };



    return (
        <div className="user-events-page">
            {/* Sync Alert Modal */}
            <AnimatePresence>
                {syncAlert && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            if (alertTimeoutRef.current) {
                                clearTimeout(alertTimeoutRef.current);
                                alertTimeoutRef.current = null;
                            }
                            setSyncAlert(null);
                        }}
                    >
                        <motion.div
                            className="sync-alert-modal"
                            initial={{ opacity: 0, scale: 0.8, y: -50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -50 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 className={`alert-title ${syncAlert.type}`}>
                                {syncAlert.message}
                            </h2>
                            {syncAlert.details && (
                                <p className="alert-details">{syncAlert.details}</p>
                            )}
                            <button
                                className="alert-close-btn"
                                onClick={() => {
                                    if (alertTimeoutRef.current) {
                                        clearTimeout(alertTimeoutRef.current);
                                        alertTimeoutRef.current = null;
                                    }
                                    setSyncAlert(null);
                                }}
                            >
                                Close
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <motion.div
                className="calendar-header-control"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>Miss Sync Events</h1>
                <p>Events missing GlobalSyncID or ResourceSyncID</p>
            </motion.div>

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
                    <form className="search-form" onSubmit={fetchEvents}>
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
                            <button
                                type="submit"
                                className="search-btn"
                                disabled={loading}
                            >
                                {loading ? <RefreshCw className="spin" size={18} /> : <Search size={18} />}
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>

            {/* Sync Alert Banner */}
            {syncAlert && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    style={{
                        padding: '20px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        background: syncAlert.type === 'success'
                            ? 'linear-gradient(135deg, rgba(46, 213, 115, 0.2), rgba(46, 213, 115, 0.05))'
                            : 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 107, 107, 0.05))',
                        border: `2px solid ${syncAlert.type === 'success' ? 'rgba(46, 213, 115, 0.5)' : 'rgba(255, 107, 107, 0.5)'}`,
                        boxShadow: syncAlert.type === 'success'
                            ? '0 4px 20px rgba(46, 213, 115, 0.3)'
                            : '0 4px 20px rgba(255, 107, 107, 0.3)',
                        position: 'relative',
                        zIndex: 10
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            fontSize: '32px',
                            lineHeight: 1
                        }}>
                            {syncAlert.type === 'success' ? '✓' : '⚠'}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: syncAlert.type === 'success' ? '#00ff88' : '#ff6b6b',
                                marginBottom: '6px'
                            }}>
                                {syncAlert.message}
                            </div>
                            {syncAlert.details && (
                                <div style={{
                                    fontSize: '0.9rem',
                                    color: 'rgba(255,255,255,0.8)',
                                    lineHeight: 1.4
                                }}>
                                    {syncAlert.details}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setSyncAlert(null)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'rgba(255,255,255,0.7)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </motion.div>
            )}

            <motion.div
                className="user-events-content-wrapper"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
            >
                {loading ? (
                    <div className="no-data">
                        <RefreshCw className="spin" size={32} />
                        <span style={{ marginLeft: '10px' }}>Loading events...</span>
                    </div>
                ) : !hasSearched ? (
                    <div className="no-data">
                        <p>Please select a date range and click Search to view events.</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="no-data">
                        <AlertCircle size={32} style={{ marginRight: '10px' }} />
                        No miss sync events found
                    </div>
                ) : (
                    <>
                        <div className="table-scroll-container">
                            <table className="user-events-table">
                                <thead>
                                    <tr>
                                        <th>Event ID</th>
                                        <th>Subject</th>
                                        <th>Room</th>
                                        <th>Time</th>
                                        <th style={{ textAlign: 'center' }}>Global ID</th>
                                        <th style={{ textAlign: 'center' }}>Resource ID</th>
                                        <th style={{ textAlign: 'center' }}>Sync ID</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagination.paginatedData.map((event) => {
                                        const isGlobalMissing = !event.globalSyncId;
                                        const isResourceMissing = !event.resourceSyncId;
                                        const isSyncIdMissing = !event.syncId;

                                        return (
                                            <tr key={event._id}>
                                                <td data-label="Event ID">
                                                    <div style={{ fontSize: '0.85rem', color: '#a0a0a0', fontFamily: 'monospace' }}>
                                                        {event._id || '-'}
                                                    </div>
                                                </td>
                                                <td data-label="Subject" style={{ fontWeight: '500' }}>{event.title || '(No Subject)'}</td>
                                                <td data-label="Room" style={{ color: '#dfe6e9' }}>{event.resourceId}</td>
                                                <td data-label="Time">
                                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                                                        <span style={{ color: '#fff' }}>
                                                            {moment(event.startTime?.unix || event.startTime).format('DD MMM YYYY')}
                                                        </span>
                                                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                                                            {moment(event.startTime?.unix || event.startTime).format('HH:mm')} -
                                                            {moment(event.endTime?.unix || event.endTime).format('HH:mm')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td data-label="Global ID" style={{ textAlign: 'center' }}>
                                                    <span
                                                        className={`status-badge ${!isGlobalMissing ? 'active' : 'cancelled'}`}
                                                        title="Global Sync ID"
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '0 auto' }}
                                                    >
                                                        <Globe size={14} />
                                                        {!isGlobalMissing ? 'Synced' : 'Missing'}
                                                    </span>
                                                </td>
                                                <td data-label="Resource ID" style={{ textAlign: 'center' }}>
                                                    <span
                                                        className={`status-badge ${!isResourceMissing ? 'active' : 'cancelled'}`}
                                                        title="Resource Sync ID"
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '0 auto' }}
                                                    >
                                                        <Smartphone size={14} />
                                                        {!isResourceMissing ? 'Synced' : 'Missing'}
                                                    </span>
                                                </td>
                                                <td data-label="Sync ID" style={{ textAlign: 'center' }}>
                                                    <span
                                                        className={`status-badge ${!isSyncIdMissing ? 'active' : 'cancelled'}`}
                                                        title="Sync ID"
                                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', margin: '0 auto' }}
                                                    >
                                                        <RefreshCw size={14} />
                                                        {!isSyncIdMissing ? 'Synced' : 'Missing'}
                                                    </span>
                                                </td>
                                                <td data-label="Action">
                                                    <button
                                                        className="view-btn"
                                                        onClick={() => syncEvent(event._id)}
                                                        disabled={syncingEventId === event._id}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                            minWidth: '100px'
                                                        }}
                                                    >
                                                        {syncingEventId === event._id ? (
                                                            <RefreshCw className="spin" size={14} />
                                                        ) : (
                                                            <RefreshCw size={14} />
                                                        )}
                                                        {syncingEventId === event._id ? 'Syncing...' : 'Sync'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

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
        </div>
    );
};

export default MissSyncEvents;
