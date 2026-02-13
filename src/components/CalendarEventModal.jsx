import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, MapPin, Users, FileText, Trash2, Code, Copy, Check, Download } from 'lucide-react'
import moment from 'moment'

export default function CalendarEventModal({ isOpen, onClose, event, onDelete, loading }) {
    const [viewMode, setViewMode] = useState('detail')
    const [copied, setCopied] = useState(false)

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
                            <button className="close-btn" onClick={onClose}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
                            {viewMode === 'detail' ? (
                                <>
                                    {/* Left Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Time */}
                                        <div className="detail-item">
                                            <Clock className="icon" size={20} />
                                            <div>
                                                <label>Time</label>
                                                <p>
                                                    {moment(event.start).format('DD MMM YYYY, HH:mm')} -
                                                    {moment(event.end).format('HH:mm')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div className="detail-item">
                                            <MapPin className="icon" size={20} />
                                            <div>
                                                <label>Location</label>
                                                <p>{event.resource?.location?.displayName || 'Unknown'}</p>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        {event.resource?.bodyPreview && (
                                            <div className="detail-item">
                                                <FileText className="icon" size={20} />
                                                <div>
                                                    <label>Description</label>
                                                    <p className="description-text">{event.resource.bodyPreview}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Organizer */}
                                        <div className="detail-item">
                                            <Users className="icon" size={20} />
                                            <div>
                                                <label>Organizer</label>
                                                <p>{event.resource?.organizer?.emailAddress?.name || 'Unknown'}</p>
                                                <span className="email-sub">
                                                    {event.resource?.organizer?.emailAddress?.address}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {/* Event IDs */}
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

                                        {/* Attendees */}
                                        {event.resource?.attendees && event.resource?.attendees.length > 0 && (
                                            <div className="detail-item" style={{ alignItems: 'flex-start' }}>
                                                <div className="icon" style={{ marginTop: 2 }}>
                                                    <Users size={20} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label>Attendees ({event.resource.attendees.length})</label>
                                                    <div className="attendees-list" style={{
                                                        marginTop: '8px',
                                                        maxHeight: '300px',
                                                        overflowY: 'auto',
                                                        paddingRight: '8px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '6px'
                                                    }}>
                                                        {event.resource.attendees.map((attendee, index) => (
                                                            <div key={index} style={{ 
                                                                border: '1px solid rgba(255,255,255,0.1)', 
                                                                padding: '8px', 
                                                                borderRadius: '6px', 
                                                                background: 'rgba(255,255,255,0.03)' 
                                                            }}>
                                                                <p style={{ fontSize: '0.9rem', marginBottom: '2px', wordBreak: 'break-word' }}>
                                                                    {attendee.emailAddress?.name || 'Unknown'}
                                                                </p>
                                                                <span className="email-sub" style={{ fontSize: '0.85rem', display: 'block', wordBreak: 'break-all', opacity: 0.7 }}>
                                                                    {attendee.emailAddress?.address}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                            {!event.isCancelled && (
                                <button className="delete-btn" onClick={onDelete} disabled={loading}>
                                    <Trash2 size={16} /> Delete
                                </button>
                            )}
                            {event.isCancelled && (
                                <span className="status-badge cancelled">
                                    Cancelled
                                </span>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
