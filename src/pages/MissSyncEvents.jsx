import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import InfoTooltip from '../components/InfoTooltip';
import '../styles/pages/shared.css';
import '../styles/pages/MissSyncEvents.css';


import useSessionState from '../hooks/useSessionState';

const MissSyncEvents = () => {

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
    const minDate = useMemo(() => new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), [])

    // New State for Room ID
    const [roomId, setRoomId] = useSessionState('missSyncEvents_roomId', '');

    // Custom Hooks
    const mobileFilter = useMobileFilter();
    const dateFilter = useDateRangeFilter('', '', 'missSyncEvents');
    const searchFilter = useSearchFilter(500, 'missSyncEvents'); // For Event ID search

    const [syncingEventId, setSyncingEventId] = useState(null);
    const [isBulkSyncing, setIsBulkSyncing] = useState(false);
    const [syncAlert, setSyncAlert] = useState(null);
    const [selectedEventIds, setSelectedEventIds] = useState([]);
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
    // Auto-search on mount if filters exist in session storage
    useEffect(() => {
        if (roomId || dateFilter.startDate || dateFilter.endDate || searchFilter.searchQuery) {
            fetchEvents()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

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
                setSelectedEventIds([]); // Clear selection on new search
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

    // --- Bulk Sync Handlers ---
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = pagination.paginatedData.map(ev => ev._id);
            setSelectedEventIds(allIds);
        } else {
            setSelectedEventIds([]);
        }
    };

    const handleSelectToggle = (eventId) => {
        setSelectedEventIds(prev =>
            prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
        );
    };

    const handleBulkSync = async () => {
        if (selectedEventIds.length === 0) return;
        setIsBulkSyncing(true);

        if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current);
        }

        try {
            const response = await MissSyncService.syncMultipleEvents(selectedEventIds);

            if (response.success) {
                const totalSuccessful = response.successful?.length || 0;
                const totalFailed = response.failed?.length || 0;

                let alertType = 'success';
                let alertMessage = 'Bulk Sync Completed';

                if (totalSuccessful === 0 && totalFailed > 0) {
                    alertType = 'error';
                    alertMessage = 'Bulk Sync Failed';
                } else if (totalSuccessful > 0 && totalFailed > 0) {
                    alertType = 'warning';
                    alertMessage = 'Bulk Sync Partially Completed';
                }

                setSyncAlert({
                    type: alertType,
                    message: alertMessage,
                    summary: response.message || `Processed ${selectedEventIds.length} events. Successful: ${totalSuccessful}, Failed: ${totalFailed}`,
                    successful: response.successful || [],
                    failed: response.failed || []
                });

                // Update the events in the list directly if there were successes
                if (response.successful && response.successful.length > 0) {
                    const successMap = new Map();
                    response.successful.forEach(res => {
                        // Res depends on backend structure, assuming res.data contains updated fields like syncEvent does
                        if (res.data && res.data.updated) {
                            successMap.set(res.eventId, res.data.updated);
                        } else if (res.data && res.data.data && res.data.data.updated) {
                            // If it's wrapped in another data object
                            successMap.set(res.eventId, res.data.data.updated);
                        }
                    });

                    if (successMap.size > 0) {
                        setEvents(prevEvents =>
                            prevEvents.map(e => {
                                if (successMap.has(e._id)) {
                                    const updatedData = successMap.get(e._id);
                                    return {
                                        ...e,
                                        globalSyncId: updatedData.globalSyncId || e.globalSyncId,
                                        resourceSyncId: updatedData.resourceSyncId || e.resourceSyncId,
                                        syncId: updatedData.syncId || e.syncId
                                    };
                                }
                                return e;
                            })
                        );
                    } else {
                        // Fallback, re-fetch to see changes if mapping is complex
                        fetchEvents();
                    }
                }

            } else {
                setSyncAlert({
                    type: 'error',
                    message: 'Bulk Sync Failed!',
                    details: response.message || 'An error occurred during bulk sync.'
                });
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
            setSyncAlert({
                type: 'error',
                message: 'Bulk Sync Failed!',
                details: errorMsg
            });
        } finally {
            setIsBulkSyncing(false);
            setSelectedEventIds([]); // Clear selection after sync attempt

            // Auto hide after 8 seconds
            alertTimeoutRef.current = setTimeout(() => {
                setSyncAlert(null);
                alertTimeoutRef.current = null;
            }, 8000);
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
                            {syncAlert.summary && (
                                <p className="alert-details" style={{ marginBottom: '16px' }}>{syncAlert.summary}</p>
                            )}

                            {/* Detailed List */}
                            <div style={{ textAlign: 'left', maxHeight: '200px', overflowY: 'auto', marginBottom: '32px', padding: '0 16px' }}>
                                {syncAlert.successful?.length > 0 && (
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ color: '#00b894', fontWeight: 'bold', marginBottom: '8px' }}>Successful ({syncAlert.successful.length}):</div>
                                        <ul style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', paddingLeft: '20px', margin: 0 }}>
                                            {syncAlert.successful.map((item, idx) => (
                                                <li key={idx} style={{ marginBottom: '4px' }}>
                                                    <span style={{ fontFamily: 'monospace' }}>{item.eventId}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {syncAlert.failed?.length > 0 && (
                                    <div>
                                        <div style={{ color: '#ff7675', fontWeight: 'bold', marginBottom: '8px' }}>Failed ({syncAlert.failed.length}):</div>
                                        <ul style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', paddingLeft: '20px', margin: 0 }}>
                                            {syncAlert.failed.map((item, idx) => (
                                                <li key={idx} style={{ marginBottom: '4px' }}>
                                                    <span style={{ fontFamily: 'monospace' }}>{item.eventId}</span>
                                                    <span style={{ opacity: 0.6, marginLeft: '8px', fontSize: '0.75rem' }}>- {item.error || 'Unknown error'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

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
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h1>Miss Sync Events</h1>
                        <InfoTooltip
                            title="About Miss Sync Events"
                            content={
                                <>
                                    <p>This page identifies reservations where synchronization between the local database and Microsoft Graph API is incomplete.</p>
                                    <ul>
                                        <li><strong>Data Source:</strong> Local <code>Event</code> collection.</li>
                                        <li><strong>Trigger:</strong> Events missing <code>globalSyncId</code>, <code>resourceSyncId</code>, or <code>syncId</code> are flagged here.</li>
                                        <li><strong>Sync Action:</strong> Clicking 'Sync' manually triggers the backend <code>missSyncService</code> to re-attempt fetching and mapping these IDs from the Graph API. Use the checkboxes to perform bulk syncs.</li>
                                        <li><strong>Date Limit:</strong> Queries are strictly clamped to a maximum of <strong>90 days</strong> from the current date.</li>
                                    </ul>
                                </>
                            }
                        />
                    </div>
                    <p>Events missing GlobalSyncID or ResourceSyncID</p>
                </div>
                {selectedEventIds.length > 0 && (
                    <button
                        className="search-btn"
                        onClick={handleBulkSync}
                        disabled={isBulkSyncing}
                        style={{ height: 'auto', padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={16} className={isBulkSyncing ? 'spin' : ''} />
                        {isBulkSyncing ? 'Syncing...' : `Sync Selected (${selectedEventIds.length})`}
                    </button>
                )}
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
                                    min={minDate}
                                    max={today}
                                    onChange={(e) => dateFilter.setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label>End Date</label>
                                <input
                                    type="date"
                                    className="custom-input date-input"
                                    value={dateFilter.endDate}
                                    min={minDate}
                                    max={today}
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
                                        <th style={{ width: '40px', textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                onChange={handleSelectAll}
                                                checked={pagination.paginatedData.length > 0 && selectedEventIds.length === pagination.paginatedData.length}
                                                style={{ cursor: 'pointer', accentColor: '#6c5ce7', width: '16px', height: '16px' }}
                                            />
                                        </th>
                                        <th>Event ID</th>
                                        <th>Subject</th>
                                        <th>Room</th>
                                        <th>Time</th>
                                        <th style={{ textAlign: 'center' }}>Global Sync</th>
                                        <th style={{ textAlign: 'center' }}>Resource Sync</th>
                                        <th style={{ textAlign: 'center' }}>Sync ID</th>
                                        <th style={{ textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagination.paginatedData.map((event) => {
                                        const isGlobalMissing = !event.globalSyncId;
                                        const isResourceMissing = !event.resourceSyncId;
                                        const isSyncIdMissing = !event.syncId;
                                        const isSelected = selectedEventIds.includes(event._id);

                                        return (
                                            <tr key={event._id} style={{ backgroundColor: isSelected ? 'rgba(108, 92, 231, 0.1)' : '' }}>
                                                <td style={{ textAlign: 'center' }} className="checkbox-cell">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleSelectToggle(event._id)}
                                                        style={{ cursor: 'pointer', accentColor: '#6c5ce7', width: '16px', height: '16px' }}
                                                    />
                                                </td>
                                                <td data-label="Event ID">
                                                    <div style={{ fontSize: '0.85rem', color: '#a0a0a0', fontFamily: 'monospace' }} title={event._id}>
                                                        {event._id ? event._id : '-'}
                                                    </div>
                                                </td>
                                                <td data-label="Subject">
                                                    <span style={{ fontWeight: 600, color: '#fff' }}>
                                                        {event.title || '(No Subject)'}
                                                    </span>
                                                </td>
                                                <td data-label="Room">
                                                    <div style={{ fontWeight: 500, color: '#dfe6e9', fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {event.resourceId}
                                                    </div>
                                                </td>
                                                <td data-label="Time">
                                                    <div className="time-cell">
                                                        <span className="time-date">
                                                            {moment(event.startTime?.unix || event.startTime).format('DD MMM YYYY')}
                                                        </span>
                                                        <span className="time-range">
                                                            {moment(event.startTime?.unix || event.startTime).format('HH:mm')} – {moment(event.endTime?.unix || event.endTime).format('HH:mm')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td data-label="Global Sync" style={{ textAlign: 'center' }}>
                                                    <span className={`sync-badge ${!isGlobalMissing ? 'synced' : 'missing'}`}>
                                                        <Globe size={12} />
                                                        {!isGlobalMissing ? 'Synced' : 'Missing'}
                                                    </span>
                                                </td>
                                                <td data-label="Resource Sync" style={{ textAlign: 'center' }}>
                                                    <span className={`sync-badge ${!isResourceMissing ? 'synced' : 'missing'}`}>
                                                        <Smartphone size={12} />
                                                        {!isResourceMissing ? 'Synced' : 'Missing'}
                                                    </span>
                                                </td>
                                                <td data-label="Sync ID" style={{ textAlign: 'center' }}>
                                                    <span className={`sync-badge ${!isSyncIdMissing ? 'synced' : 'missing'}`}>
                                                        <RefreshCw size={12} />
                                                        {!isSyncIdMissing ? 'Synced' : 'Missing'}
                                                    </span>
                                                </td>
                                                <td data-label="Action" style={{ textAlign: 'center' }}>
                                                    <button
                                                        className={`sync-btn${syncingEventId === event._id ? ' syncing' : ''}`}
                                                        onClick={() => syncEvent(event._id)}
                                                        disabled={syncingEventId === event._id}
                                                    >
                                                        <RefreshCw size={14} className={syncingEventId === event._id ? 'spin' : ''} />
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
