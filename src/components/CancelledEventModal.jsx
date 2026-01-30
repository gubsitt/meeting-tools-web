import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, MapPin, User, Users, Calendar as CalendarIcon, Code, Copy, Check, Download } from 'lucide-react'
import dayjs from 'dayjs'
import Loading from './Loading'

export default function CancelledEventModal({ isOpen, onClose, event, loading }) {
    const [viewMode, setViewMode] = useState('detail')
    const [copied, setCopied] = useState(false)

    if (!isOpen) return null

    const handleCopyJson = () => {
        if (!event) return
        const jsonString = JSON.stringify(event, null, 2)
        navigator.clipboard.writeText(jsonString)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleDownloadJson = () => {
        if (!event) return
        const jsonString = JSON.stringify(event, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `cancelled_event_${event.event?.eventId || 'data'}.json`
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
                        <div className="modal-header">
                            <div>
                                <h2>Cancelled Event Details</h2>
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

                        <div className="modal-body">
                            {loading ? (
                                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Loading />
                                </div>
                            ) : event ? (
                                viewMode === 'detail' ? (
                                    <>
                                        {/* Event Info */}
                                        <div className="detail-item">
                                            <Clock className="icon" size={20} />
                                            <div>
                                                <label>Subject</label>
                                                <p>{event.event.title || 'No Subject'}</p>
                                            </div>
                                        </div>

                                        <div className="detail-item">
                                            <MapPin className="icon" size={20} />
                                            <div>
                                                <label>Room</label>
                                                <p>{event.event.resourceId}</p>
                                            </div>
                                        </div>

                                        <div className="detail-item">
                                            <CalendarIcon className="icon" size={20} />
                                            <div>
                                                <label>Original Time</label>
                                                <p>
                                                    {dayjs(event.event.startTime.unix).format('DD MMM YYYY, HH:mm')} -
                                                    {dayjs(event.event.endTime.unix).format('HH:mm')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Owner Info */}
                                        <div className="detail-item">
                                            <User className="icon" size={20} />
                                            <div>
                                                <label>Booked By</label>
                                                {event.owner ? (
                                                    <>
                                                        <p>{event.owner.name} ({event.owner.initial})</p>
                                                        <span className="email-sub">{event.owner.email}</span>
                                                    </>
                                                ) : (
                                                    <p style={{ color: '#ff7675' }}>Owner profile not found</p>
                                                )}
                                            </div>
                                        </div>

                                        {event.owner?.division && (
                                            <div className="detail-item">
                                                <Users className="icon" size={20} />
                                                <div>
                                                    <label>Division</label>
                                                    <p>{event.owner.division}</p>
                                                </div>
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
                                            {JSON.stringify(event, null, 2)}
                                        </pre>
                                    </div>
                                )
                            ) : (
                                <div style={{ textAlign: 'center', color: '#ff7675' }}>
                                    Failed to load event details.
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
