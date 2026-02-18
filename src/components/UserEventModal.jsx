import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, MapPin, User, Users, KeyRound, CalendarPlus, Info, Car, Code, Copy, Check, Download, Eye, EyeOff, UserCheck, ChevronDown, Edit2, Save } from 'lucide-react'
import moment from 'moment'
import UserEventService from '../services/UserEventService'
import '../styles/components/UserEventModal.css'
import toast from 'react-hot-toast'

export default function UserEventModal({ isOpen, onClose, event, onUpdate }) {
    const [viewMode, setViewMode] = useState('detail') // detail, json, edit
    const [copied, setCopied] = useState(false)
    const [showAllHistory, setShowAllHistory] = useState(false)
    const [usersData, setUsersData] = useState({})
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [editFormData, setEditFormData] = useState({
        resourceId: '',
        pendingSync: false,
        cancelled: false,
        impersonated: false
    })

    // Fetch user data when modal opens
    useEffect(() => {
        if (!isOpen || !event) return

        const fetchUsers = async () => {
            const userIds = []

            // Add owner ID
            if (event.resource?.owner) {
                userIds.push(event.resource.owner)
            }

            // Add attendee IDs
            if (event.resource?.attendees && event.resource.attendees.length > 0) {
                userIds.push(...event.resource.attendees)
            }

            // Remove duplicates
            const uniqueUserIds = [...new Set(userIds)]

            if (uniqueUserIds.length === 0) return

            setLoadingUsers(true)
            try {
                const response = await UserEventService.getUsersByIds(uniqueUserIds)
                if (response.success && response.data) {
                    // Create a map of userId -> user object
                    const usersMap = {}
                    response.data.forEach(user => {
                        usersMap[user._id] = user
                    })
                    setUsersData(usersMap)
                }
            } catch (error) {
                console.error('Error fetching users:', error)
            } finally {
                setLoadingUsers(false)
            }
        }

        fetchUsers()
        fetchUsers()
    }, [isOpen, event])

    useEffect(() => {
        if (event) {
            setEditFormData({
                resourceId: event.resource?.resourceId || '',
                pendingSync: event.resource?.pendingSync || false,
                cancelled: event.resource?.cancelled || false,
                impersonated: event.resource?.impersonated || false
            })
            setIsEditing(false)
            setViewMode('detail')
        }
    }, [event])

    if (!isOpen || !event) return null

    const handleCopyJson = () => {
        if (!event) return
        const jsonString = JSON.stringify(event.resource, null, 2)
        navigator.clipboard.writeText(jsonString)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownloadJson = () => {
        if (!event) return
        const jsonString = JSON.stringify(event.resource, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${event.title || 'event'}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const handleSave = async () => {


        setSaving(true)
        try {
            const updateData = {
                resourceId: editFormData.resourceId,
                pendingSync: editFormData.pendingSync,
                cancelled: editFormData.cancelled,
                impersonated: editFormData.impersonated
            }

            // user requested backend snippets show it expects 'resourceId', 'title', 'pendingSync', ...
            // And it seems to handle specific fields.
            // Let's assume standard timestamp or ISO string. The prompt snippet said "startTime", "endTime".
            // Typically backend expects ISO or timestamp. If `event.start` was used to init moment, it's likely a date object or string.
            // UserEvents.jsx:99 `start: new Date(item.startTime.unix)` -> checks out, `unix` likely millis or seconds.
            // Wait, `item.startTime.unix` suggesting it IS unix timestamp.
            // But `UserEventService` snippet wasn't shown for the *existing* update.
            // The user snippet `updateEvent` uses `Event.findByIdAndUpdate`.
            // Let's send what we have. If backend expects something else, we might need to adjust.
            // Based on `UserEvents.jsx`: `start: new Date(item.startTime.unix)`
            // If I send new Date().valueOf(), that's millis.

            const response = await UserEventService.updateEvent(event.id, updateData)

            if (response.success) {
                toast.success('Event updated successfully')
                setIsEditing(false)
                setViewMode('detail')

                // Call parent callback to update list and selected event without refresh
                if (onUpdate && response.data) {
                    onUpdate(response.data)
                } else if (onClose) {
                    // Fallback if no onUpdate provided
                    onClose()
                }
            } else {
                throw new Error(response.message || 'Failed to update')
            }
        } catch (error) {
            console.error(error)
            toast.error(error.message || 'Failed to update event')
        } finally {
            setSaving(false)
        }
    }

    // Reset view mode when modal opens/changes
    // React's key prop on the component instance in parent can handle reset, 
    // or we can use useEffect here. 
    // For simplicity, we'll let the user manage it or default to 'detail' on mount.

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="event-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
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
                                <h2>{event.title}</h2>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <button
                                        onClick={() => {
                                            if (isEditing) {
                                                setIsEditing(false)
                                                setViewMode('detail')
                                            } else {
                                                setIsEditing(true)
                                                setViewMode('edit')
                                            }
                                        }}
                                        style={{
                                            background: isEditing ? 'rgba(108, 92, 231, 0.3)' : 'transparent',
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
                                        <Edit2 size={14} /> {isEditing ? 'Cancel' : 'Edit'}
                                    </button>
                                    {!isEditing && (
                                        <>
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
                                        </>
                                    )}
                                </div>
                            </div>
                            <button className="close-btn" onClick={onClose}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body">
                            {isEditing ? (
                                <div className="edit-form" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px', fontSize: '0.9rem' }}>Resource ID</label>
                                        <input
                                            type="text"
                                            value={editFormData.resourceId}
                                            onChange={(e) => setEditFormData({ ...editFormData, resourceId: e.target.value })}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(0, 0, 0, 0.2)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                color: 'white',
                                                outline: 'none',
                                                fontSize: '1rem',
                                                fontFamily: 'monospace'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                                        <div className="form-group">
                                            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px', fontSize: '0.9rem' }}>Pending Sync</label>
                                            <select
                                                value={editFormData.pendingSync.toString()}
                                                onChange={(e) => setEditFormData({ ...editFormData, pendingSync: e.target.value === 'true' })}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(0, 0, 0, 0.2)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    color: 'white',
                                                    outline: 'none',
                                                    fontSize: '0.95rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="true" style={{ color: 'black' }}>True</option>
                                                <option value="false" style={{ color: 'black' }}>False</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px', fontSize: '0.9rem' }}>Cancelled</label>
                                            <select
                                                value={editFormData.cancelled.toString()}
                                                onChange={(e) => setEditFormData({ ...editFormData, cancelled: e.target.value === 'true' })}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(0, 0, 0, 0.2)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    color: 'white',
                                                    outline: 'none',
                                                    fontSize: '0.95rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="true" style={{ color: 'black' }}>True</option>
                                                <option value="false" style={{ color: 'black' }}>False</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px', fontSize: '0.9rem' }}>Impersonated</label>
                                            <select
                                                value={editFormData.impersonated.toString()}
                                                onChange={(e) => setEditFormData({ ...editFormData, impersonated: e.target.value === 'true' })}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(0, 0, 0, 0.2)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    color: 'white',
                                                    outline: 'none',
                                                    fontSize: '0.95rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="true" style={{ color: 'black' }}>True</option>
                                                <option value="false" style={{ color: 'black' }}>False</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false)
                                                setViewMode('detail')
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                padding: '10px 20px',
                                                borderRadius: '8px',
                                                cursor: 'pointer'
                                            }}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            style={{
                                                background: '#6c5ce7',
                                                border: 'none',
                                                color: 'white',
                                                padding: '10px 20px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                opacity: saving ? 0.7 : 1
                                            }}
                                        >
                                            {saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                                        </button>
                                    </div>
                                </div>
                            ) : viewMode === 'detail' ? (
                                <>
                                    <div className="detail-item">
                                        <Code className="icon" size={20} />
                                        <div>
                                            <label>Event IDs</label>
                                            <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                                <span style={{ opacity: 0.7 }}>ID:</span> {event.id}
                                            </p>
                                            {event.resource?.iCalUId && (
                                                <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all', marginTop: '4px' }}>
                                                    <span style={{ opacity: 0.7 }}>iCalUID:</span> {event.resource.iCalUId}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <Clock className="icon" size={20} />
                                        <div>
                                            <label>Time</label>
                                            <p>
                                                {moment(event.start).format('DD MMM YYYY, HH:mm')} - {moment(event.end).format('HH:mm')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="detail-item">
                                        <MapPin className="icon" size={20} />
                                        <div>
                                            <label>Resource</label>
                                            <p>{event.location}</p>
                                            {event.resource.roomType && (
                                                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                                    Type: {event.resource.roomType}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Custom Field for Car (Start -> Destination) */}
                                    {event.resource.customField && (event.resource.customField.start || event.resource.customField.destination) && (
                                        <div className="detail-item">
                                            <Car className="icon" size={20} />
                                            <div>
                                                <label>Route (Car)</label>
                                                <p>
                                                    {event.resource.customField.start || '?'} <span style={{ color: '#a29bfe' }}>➜</span> {event.resource.customField.destination || '?'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="detail-item">
                                        <User className="icon" size={20} />
                                        <div>
                                            <label>Owner</label>
                                            {loadingUsers ? (
                                                <p style={{ opacity: 0.6 }}>Loading...</p>
                                            ) : usersData[event.resource.owner] ? (
                                                <p>
                                                    {usersData[event.resource.owner].name || usersData[event.resource.owner].email}
                                                    <span style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginTop: '2px' }}>
                                                        {usersData[event.resource.owner].email}
                                                    </span>
                                                </p>
                                            ) : (
                                                <p style={{ fontFamily: 'monospace', fontSize: '0.8rem', opacity: 0.7 }}>
                                                    {event.resource.owner}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        {event.resource.checkInPin && (
                                            <div className="detail-item">
                                                <KeyRound className="icon" size={20} />
                                                <div>
                                                    <label>Check-in PIN</label>
                                                    <p style={{ fontFamily: 'monospace', fontSize: '1.2rem', color: '#55efc4' }}>
                                                        {event.resource.checkInPin}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        <div className="detail-item">
                                            <UserCheck className="icon" size={20} />
                                            <div>
                                                <label>Checked In</label>
                                                <p style={{ color: event.resource.checkedIn ? '#55efc4' : '#ff6b6b' }}>
                                                    {event.resource.checkedIn ? 'Yes' : 'No'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="detail-item">
                                            {event.resource.private ? <EyeOff className="icon" size={20} /> : <Eye className="icon" size={20} />}
                                            <div>
                                                <label>Private Event</label>
                                                <p>{event.resource.private ? 'Yes' : 'No'}</p>
                                            </div>
                                        </div>

                                        <div className="detail-item">
                                            <User className="icon" size={20} />
                                            <div>
                                                <label>Impersonate</label>
                                                <p>{event.resource.impersonate ? 'Yes' : 'No'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {event.resource.attendees && event.resource.attendees.length > 0 && (
                                        <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                            <Users className="icon" size={20} />
                                            <div style={{ width: '100%' }}>
                                                <label>Attendees ({event.resource.attendees.length} people)</label>
                                                {loadingUsers ? (
                                                    <p style={{ opacity: 0.6 }}>Loading...</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                                                        {event.resource.attendees.map((attendeeId, index) => {
                                                            const user = usersData[attendeeId]
                                                            return (
                                                                <div
                                                                    key={attendeeId || index}
                                                                    style={{
                                                                        background: 'rgba(108, 92, 231, 0.1)',
                                                                        border: '1px solid rgba(108, 92, 231, 0.2)',
                                                                        borderRadius: '8px',
                                                                        padding: '8px 12px',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '8px'
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            width: '32px',
                                                                            height: '32px',
                                                                            borderRadius: '50%',
                                                                            background: 'rgba(108, 92, 231, 0.3)',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            fontSize: '0.9rem',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    >
                                                                        {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
                                                                    </div>
                                                                    <div style={{ flex: 1 }}>
                                                                        {user ? (
                                                                            <>
                                                                                <div style={{ fontWeight: '500' }}>
                                                                                    {user.name || user.email}
                                                                                </div>
                                                                                {user.name && (
                                                                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>
                                                                                        {user.email}
                                                                                    </div>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.6 }}>
                                                                                {attendeeId}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div className="detail-item">
                                            <CalendarPlus className="icon" size={20} />
                                            <div>
                                                <label>Created At</label>
                                                <p>{moment(event.resource.createdTime).format('DD MMM YYYY, HH:mm:ss')}</p>
                                            </div>
                                        </div>

                                        {(() => {
                                            // Get last update from transactions or updateTime
                                            let lastUpdateTime = event.resource.updateTime
                                            if (event.resource.transactions && event.resource.transactions.length > 0) {
                                                const sortedTrans = [...event.resource.transactions]
                                                    .sort((a, b) => (b.time?.unix || 0) - (a.time?.unix || 0))
                                                const lastTrans = sortedTrans[0]
                                                if (lastTrans?.time?.unix) {
                                                    // Check if timestamp is in milliseconds (> year 3000 in seconds)
                                                    const timestamp = lastTrans.time.unix
                                                    lastUpdateTime = timestamp > 32503680000
                                                        ? moment(timestamp)
                                                        : moment.unix(timestamp)
                                                }
                                            }
                                            return lastUpdateTime ? (
                                                <div className="detail-item">
                                                    <Clock className="icon" size={20} />
                                                    <div>
                                                        <label>Updated At</label>
                                                        <p>{moment(lastUpdateTime).format('DD MMM YYYY, HH:mm:ss')}</p>
                                                    </div>
                                                </div>
                                            ) : null
                                        })()}
                                    </div>

                                    {/* --- Transaction Timeline --- */}
                                    {event.resource.transactions && event.resource.transactions.length > 0 && (
                                        <div className="transaction-section" style={{ gridColumn: '1 / -1' }}>
                                            <h3>History</h3>
                                            <div className="timeline">
                                                {[...event.resource.transactions]
                                                    .sort((a, b) => (b.time?.unix || 0) - (a.time?.unix || 0)) // Sort desc
                                                    .slice(0, showAllHistory ? undefined : 2)
                                                    .map((trans, index) => {
                                                        // Check if timestamp is in milliseconds or seconds
                                                        // Unix timestamp for year 3000 is ~32503680000 seconds
                                                        const timestamp = trans.time?.unix || 0
                                                        const transDate = timestamp > 32503680000
                                                            ? moment(timestamp) // milliseconds
                                                            : moment.unix(timestamp) // seconds
                                                        return (
                                                            <div key={trans._id || index} className="timeline-item">
                                                                <div className={`timeline-dot ${trans.action}`} />
                                                                <div className="timeline-content">
                                                                    <div className="timeline-action">
                                                                        {trans.action} By User
                                                                    </div>
                                                                    <div className="timeline-date">
                                                                        <Clock size={12} />
                                                                        <span>
                                                                            {transDate.format('DD/MM/YYYY HH:mm')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                            {event.resource.transactions.length > 2 && !showAllHistory && (
                                                <button
                                                    onClick={() => setShowAllHistory(true)}
                                                    style={{
                                                        marginTop: '12px',
                                                        background: 'rgba(108, 92, 231, 0.2)',
                                                        border: '1px solid rgba(108, 92, 231, 0.3)',
                                                        color: 'white',
                                                        padding: '6px 16px',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        width: '100%',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    <ChevronDown size={14} />
                                                    +{event.resource.transactions.length - 2} more
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ position: 'relative', gridColumn: '1 / -1' }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        display: 'flex',
                                        gap: '8px'
                                    }}>
                                        <button
                                            onClick={handleDownloadJson}
                                            style={{
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
                                            title="Download JSON"
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button
                                            onClick={handleCopyJson}
                                            style={{
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
                                            title="Copy to Clipboard"
                                        >
                                            {copied ? <Check size={16} color="#55efc4" /> : <Copy size={16} />}
                                            {copied && <span style={{ fontSize: '0.8rem', color: '#55efc4' }}>Copied!</span>}
                                        </button>
                                    </div>
                                    <pre style={{
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        overflowX: 'auto',
                                        color: '#a29bfe',
                                        fontSize: '0.85rem',
                                        fontFamily: 'monospace',
                                        maxHeight: '400px',
                                        marginTop: '0'
                                    }}>
                                        {JSON.stringify(event.resource, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="modal-footer">
                            <div />
                            <span className={`status-badge ${event.isCancelled ? 'cancelled' : 'active'}`}>
                                {event.isCancelled ? 'Cancelled' : 'Scheduled'}
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
