import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, GitCompare, Filter, AlertCircle, CloudOff, CheckCircle2, Clock, User, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import CompareEventService from '../services/CompareEventService';
import UserEventService from '../services/UserEventService';
import useDateRangeFilter from '../hooks/useDateRangeFilter';
import useMobileFilter from '../hooks/useMobileFilter';
import usePagination from '../hooks/usePagination';
import useSessionState from '../hooks/useSessionState';
import Pagination from '../components/Pagination';
import Loading from '../components/Loading';
import InfoTooltip from '../components/InfoTooltip';
import '../styles/pages/shared.css';
import '../styles/pages/MissSyncEvents.css';
import '../styles/pages/CompareEvents.css';

const formatDateTime = (dt) => {
    if (!dt) return '-';
    if (typeof dt === 'object' && dt.unix) {
        return moment(dt.unix).format('DD/MM/YYYY HH:mm');
    }
    return moment(dt).isValid() ? moment(dt).format('DD/MM/YYYY HH:mm') : '-';
};

const ReasonBadge = ({ reason }) => {
    if (!reason) return null;
    const map = {
        'title not matched': { label: 'Title not matched', cls: 'title-not-matched' },
        'time not matched': { label: 'Time not matched', cls: 'time-not-matched' },
        'not found in O365': { label: 'Not found in O365', cls: 'not-found' },
    };
    const entry = map[reason] || { label: reason, cls: 'not-found' };
    return <span className={`reason-badge ${entry.cls}`}>{entry.label}</span>;
};

export default function CompareEvents() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [ownerMap, setOwnerMap] = useState({});

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const minDate = useMemo(() => new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), []);

    const [roomEmail, setRoomEmail] = useSessionState('compareEvents_roomEmail', '');
    const [topCount, setTopCount] = useSessionState('compareEvents_top', '1000');

    const dateFilter = useDateRangeFilter('', '', 'compareEvents');
    const mobileFilter = useMobileFilter();

    const o365List = result?.o365Only ?? [];
    const mitList = result?.mitOnly ?? [];

    const paginationO365 = usePagination(o365List, 10);
    const paginationMIT = usePagination(mitList, 10);

    const handleSearch = async () => {
        if (!roomEmail.trim()) {
            toast.error('Please enter Room Email');
            return;
        }
        mobileFilter.close();
        setLoading(true);
        setResult(null);
        paginationO365.resetPagination();
        paginationMIT.resetPagination();

        try {
            const params = { roomEmail: roomEmail.trim(), view: 'all' };
            if (dateFilter.startDate) params.startDate = moment(dateFilter.startDate).startOf('day').toISOString();
            if (dateFilter.endDate) params.endDate = moment(dateFilter.endDate).endOf('day').toISOString();
            if (topCount) params.top = parseInt(topCount);

            const res = await CompareEventService.getCompareEvents(params);
            if (res.success) {
                setResult(res);
                const { o365Only = [], mitOnly = [] } = res;
                toast.success(`O365 Only: ${o365Only.length} | MIT Only: ${mitOnly.length}`);

                // Resolve MIT owner IDs → email
                const ownerIds = [...new Set(mitOnly.map(e => e.owner).filter(Boolean))];
                if (ownerIds.length > 0) {
                    try {
                        const usersRes = await UserEventService.getUsersByIds(ownerIds);
                        if (usersRes.success && usersRes.data) {
                            const map = {};
                            usersRes.data.forEach(u => { map[u._id] = u.email || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u._id; });
                            setOwnerMap(map);
                        }
                    } catch { /* silent */ }
                }
            } else {
                toast.error(res.message || 'Failed to compare events');
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || err.message || 'Error fetching compare data');
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setRoomEmail('');
        setTopCount('1000');
        dateFilter.resetDates();
        setResult(null);
        setOwnerMap({});
        paginationO365.resetPagination();
        paginationMIT.resetPagination();
        mobileFilter.open();
    };

    // Auto-search on mount if session state has roomEmail
    useEffect(() => {
        if (roomEmail) {
            handleSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const summary = result?.summary;

    return (
        <div className="user-events-page">
            {/* Floating Orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            {/* Header */}
            <motion.div
                className="calendar-header-control"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h1>Compare Events</h1>
                    <InfoTooltip
                        title="About Compare Events"
                        content={
                            <>
                                <p>This page compares meeting room events between O365 and the local database to detect discrepancies.</p>
                                <ul>
                                    <li><strong>O365 Only:</strong> Events in Microsoft Graph but missing from the local database.</li>
                                    <li><strong>MIT Only:</strong> Events in the local database but missing from O365.</li>
                                    <li><strong>Data Source:</strong> Direct comparison between <code>Microsoft Graph API</code> and local <code>Event</code> collection.</li>
                                    <li><strong>Date Limit:</strong> Defaults to <strong>±30 days</strong> from the current date to optimize API performance.</li>
                                </ul>
                            </>
                        }
                    />
                </div>
                <p>Compare events between O365 (Microsoft Graph) and MIT Database</p>
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
                    <span><Filter size={16} /> Filters & Search</span>
                    <button type="button" className="icon-btn">
                        {mobileFilter.isOpen ? <X size={20} /> : <Filter size={20} />}
                    </button>
                </div>

                <div className={`search-form-wrapper ${mobileFilter.isOpen ? 'open' : ''}`}>
                    <div className="search-form">
                        {/* Room Email */}
                        <div className="form-group-inline" style={{ minWidth: 260, flex: 2 }}>
                            <label className="desktop-only-label">Room ID</label>
                            <input
                                type="email"
                                className="custom-input"
                                placeholder="Search by Room ID..."
                                value={roomEmail}
                                onChange={(e) => setRoomEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>

                        {/* Date Range */}
                        <div className="date-group-row">
                            <div className="form-group-inline">
                                <label className="desktop-only-label">Start Date</label>
                                <input
                                    type="date"
                                    className="custom-input date-input"
                                    value={dateFilter.startDate}
                                    min={minDate}
                                    max={dateFilter.endDate || today}
                                    onChange={(e) => dateFilter.setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group-inline">
                                <label className="desktop-only-label">End Date</label>
                                <input
                                    type="date"
                                    className="custom-input date-input"
                                    value={dateFilter.endDate}
                                    min={dateFilter.startDate || minDate}
                                    max={today}
                                    onChange={(e) => dateFilter.setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="form-group-inline search-btn-wrapper">
                            <label className="desktop-only-label" style={{ opacity: 0 }}>Search</label>
                            <button
                                className="search-btn"
                                onClick={handleSearch}
                                disabled={loading}
                            >
                                <Search size={18} />
                                {loading ? 'Comparing…' : 'Compare'}
                            </button>
                        </div>

                        {result && (
                            <div className="form-group-inline search-btn-wrapper">
                                <label className="desktop-only-label" style={{ opacity: 0 }}>Clear</label>
                                <button
                                    className="search-btn"
                                    style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'none' }}
                                    onClick={handleClear}
                                >
                                    <X size={18} />
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Loading */}
            {loading && <Loading />}

            {/* Result */}
            {!loading && result && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Summary Cards */}
                    <div className="compare-summary-grid">
                        <div className="compare-summary-card card-o365">
                            <span className="compare-summary-label">O365 Only</span>
                            <span className="compare-summary-value">{summary?.o365Only ?? 0}</span>
                        </div>
                        <div className="compare-summary-card card-missed">
                            <span className="compare-summary-label">MIT Only</span>
                            <span className="compare-summary-value">{summary?.mitOnly ?? 0}</span>
                        </div>
                    </div>

                    {/* Two-panel layout */}
                    <div className="compare-panels">
                        {/* O365 Only Panel */}
                        <div className="compare-panel">
                            <div className="compare-panel-header compare-panel-header--o365">
                                <CloudOff size={16} />
                                <span>O365 Only</span>
                                <span className="compare-tab-badge">{o365List.length}</span>
                            </div>
                            <div className="compare-table-wrapper">
                                <div className="compare-card-list">
                                    {o365List.length === 0 ? (
                                        <div className="compare-empty">
                                            <CheckCircle2 size={40} />
                                            <p>No O365-only events</p>
                                        </div>
                                    ) : (
                                        <O365Cards events={paginationO365.paginatedData} />
                                    )}
                                </div>
                                {o365List.length > 0 && (
                                    <div style={{ padding: '8px 14px 12px' }}>
                                        <Pagination
                                            currentPage={paginationO365.currentPage}
                                            totalPages={paginationO365.totalPages}
                                            onPageChange={paginationO365.handlePageChange}
                                            totalItems={o365List.length}
                                            itemsPerPage={10}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* MIT Only Panel */}
                        <div className="compare-panel">
                            <div className="compare-panel-header compare-panel-header--mit">
                                <AlertCircle size={16} />
                                <span>MIT Only</span>
                                <span className="compare-tab-badge">{mitList.length}</span>
                            </div>
                            <div className="compare-table-wrapper">
                                <div className="compare-card-list">
                                    {mitList.length === 0 ? (
                                        <div className="compare-empty">
                                            <CheckCircle2 size={40} />
                                            <p>No MIT-only events</p>
                                        </div>
                                    ) : (
                                        <MITCards events={paginationMIT.paginatedData} ownerMap={ownerMap} />
                                    )}
                                </div>
                                {mitList.length > 0 && (
                                    <div style={{ padding: '8px 14px 12px' }}>
                                        <Pagination
                                            currentPage={paginationMIT.currentPage}
                                            totalPages={paginationMIT.totalPages}
                                            onPageChange={paginationMIT.handlePageChange}
                                            totalItems={mitList.length}
                                            itemsPerPage={10}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Prompt when no search yet */}
            {!loading && !result && (
                <div className="compare-empty" style={{ marginTop: 60 }}>
                    <GitCompare size={54} />
                    <p>Enter a Room Email and press <strong>Compare</strong> to get started</p>
                </div>
            )}
        </div>
    );
}

/* ========== Card Components ========== */

function O365Cards({ events }) {
    return (
        <>
            {events.map((ev, i) => (
                <div key={ev.key || i} className="compare-event-card">
                    <div className="compare-card-title">
                        {ev.title || ev.titleTrim || '-'}
                        {ev.title !== ev.titleTrim && <small>{ev.titleTrim}</small>}
                    </div>
                    <div className="compare-card-meta">
                        <div className="compare-card-meta-item">
                            <span className="compare-card-meta-label"><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />Start</span>
                            <span className="compare-card-meta-value">{formatDateTime(ev.startTime)}</span>
                        </div>
                        <div className="compare-card-meta-item">
                            <span className="compare-card-meta-label"><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />End</span>
                            <span className="compare-card-meta-value">{formatDateTime(ev.endTime)}</span>
                        </div>
                        <div className="compare-card-meta-item">
                            <span className="compare-card-meta-label"><User size={10} style={{ display: 'inline', marginRight: 3 }} />Organizer</span>
                            <span className="compare-card-meta-value">{ev.organizer || '-'}</span>
                        </div>
                        {ev.location && (
                            <div className="compare-card-meta-item">
                                <span className="compare-card-meta-label"><MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />Location</span>
                                <span className="compare-card-meta-value">{ev.location}</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </>
    );
}

function MITCards({ events, ownerMap = {} }) {
    return (
        <>
            {events.map((ev, i) => (
                <div key={ev.id || i} className="compare-event-card">
                    <div className="compare-card-title">
                        {ev.title || '-'}
                        {ev.title !== ev.titleTrim && <small>{ev.titleTrim}</small>}
                    </div>
                    <div className="compare-card-meta">
                        <div className="compare-card-meta-item">
                            <span className="compare-card-meta-label"><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />Start</span>
                            <span className="compare-card-meta-value">{formatDateTime(ev.startTime)}</span>
                        </div>
                        <div className="compare-card-meta-item">
                            <span className="compare-card-meta-label"><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />End</span>
                            <span className="compare-card-meta-value">{formatDateTime(ev.endTime)}</span>
                        </div>
                        <div className="compare-card-meta-item">
                            <span className="compare-card-meta-label"><User size={10} style={{ display: 'inline', marginRight: 3 }} />Owner</span>
                            <span className="compare-card-meta-value">{ownerMap[ev.owner] || ev.owner || '-'}</span>
                        </div>
                        <div className="compare-card-meta-item">
                            <span className="compare-card-meta-label">Resource ID</span>
                            <span className="compare-card-meta-value" style={{ fontSize: '0.75rem', opacity: 0.7 }}>{ev.resourceId || '-'}</span>
                        </div>
                    </div>
                    <div className="compare-card-footer">
                        <ReasonBadge reason={ev.reason} />
                    </div>
                </div>
            ))}
        </>
    );
}
