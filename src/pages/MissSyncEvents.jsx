import React, { useState } from 'react';
import MissSyncService from '../services/MissSyncService';
import { Search, RefreshCw, AlertCircle, Smartphone, Globe, Filter, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import { motion } from 'framer-motion';
import './UserEvents.css'; // Reusing UserEvents styles for consistency

const MissSyncEvents = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [startDate, setStartDate] = useState(moment().startOf('month').format('YYYY-MM-DD'));
    const [endDate, setEndDate] = useState(moment().endOf('month').format('YYYY-MM-DD'));
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
    const [syncingEventId, setSyncingEventId] = useState(null);
    const [syncResults, setSyncResults] = useState({});

    const fetchEvents = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        setHasSearched(true);
        setIsMobileFilterOpen(false);
        try {
            // Send ISO strings with start/end of day times
            const start = moment(startDate).startOf('day').toISOString();
            const end = moment(endDate).endOf('day').toISOString();

            const response = await MissSyncService.getMissSyncEvents(start, end);
            if (response.success) {
                setEvents(response.data);
                if (response.data.length > 0) {
                    toast.success(`Found ${response.count} events`);
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
        try {
            const response = await MissSyncService.syncMissingSyncIds(eventId);
            
            // Check if sync was successful (response.data.success or response.success)
            const isSuccess = response.data?.success || response.success;
            const syncData = response.data || response;
            
            if (isSuccess) {
                // Store sync result
                setSyncResults(prev => ({ ...prev, [eventId]: syncData }));
                
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
                
                const updatedFields = syncData.updated ? Object.keys(syncData.updated) : [];
                toast.success(`✅ Synced${updatedFields.length > 0 ? ': ' + updatedFields.join(', ') : ''}`, { duration: 4000 });
            } else {
                // Store failed sync result
                setSyncResults(prev => ({ ...prev, [eventId]: syncData }));
                
                // Get error messages from response.data.errors
                const errors = syncData.errors || [];
                const errorMsg = errors.length > 0 ? errors.join(' | ') : (response.message || 'Sync failed');
                toast.error(`❌ Sync Failed: ${errorMsg}`, { duration: 6000 });
            }
        } catch (error) {
            // Store error in syncResults
            const errorData = error.response?.data?.data || error.response?.data;
            const errorMessages = errorData?.errors || [error.response?.data?.message || error.message || 'Unknown error'];
            
            setSyncResults(prev => ({ 
                ...prev, 
                [eventId]: { 
                    success: false, 
                    errors: errorMessages
                } 
            }));
            
            const errorMsg = Array.isArray(errorMessages) ? errorMessages.join(' | ') : errorMessages;
            toast.error(`❌ Sync Failed: ${errorMsg}`, { duration: 6000 });
            console.error(error);
        } finally {
            setSyncingEventId(null);
        }
    };

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
                <div className="mobile-filter-header" onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}>
                    <span><Search size={16} /> Filters & Search</span>
                    <button type="button" className="icon-btn">
                        {isMobileFilterOpen ? <X size={20} /> : <Filter size={20} />}
                    </button>
                </div>

                <div className={`search-form-wrapper ${isMobileFilterOpen ? 'open' : ''}`}>
                    <form className="search-form" onSubmit={fetchEvents}>
                        <div className="date-group-row">
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
                        </div>
                        <div className="form-group-inline">
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
                    <table className="user-events-table">
                        <thead>
                            <tr>
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
                            {events.map((event) => {
                                const isGlobalMissing = !event.globalSyncId;
                                const isResourceMissing = !event.resourceSyncId;
                                const isSyncIdMissing = !event.syncId;

                                return (
                                    <tr key={event._id}>
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
                                            {syncResults[event._id] && (
                                                <div style={{ 
                                                    marginTop: '8px', 
                                                    fontSize: '0.75rem', 
                                                    padding: '6px 8px', 
                                                    borderRadius: '4px',
                                                    background: syncResults[event._id].success 
                                                        ? 'rgba(46, 213, 115, 0.1)' 
                                                        : 'rgba(255, 71, 87, 0.1)',
                                                    color: syncResults[event._id].success ? '#2ed573' : '#ff4757',
                                                    border: `1px solid ${syncResults[event._id].success ? 'rgba(46, 213, 115, 0.3)' : 'rgba(255, 71, 87, 0.3)'}`
                                                }}>
                                                    {syncResults[event._id].success ? (
                                                        <>
                                                            <div><strong>✅ Updated:</strong></div>
                                                            {syncResults[event._id].updated && Object.entries(syncResults[event._id].updated).map(([key, value]) => (
                                                                <div key={key}>• {key}: {value?.substring(0, 20)}...</div>
                                                            ))}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div><strong>❌ Errors:</strong></div>
                                                            {syncResults[event._id].errors && Array.isArray(syncResults[event._id].errors) && syncResults[event._id].errors.map((err, idx) => (
                                                                <div key={idx}>• {err}</div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </motion.div>
        </div>
    );
};

export default MissSyncEvents;
