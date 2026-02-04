import React, { useState, useEffect } from 'react';
import ConfigFileService from '../services/ConfigFileService';
import { FileText, Copy, Download, RefreshCw, AlertCircle, Check, Filter, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import './UserEvents.css';
import './ConfigFile.css';

const ConfigFile = () => {
    const [fileData, setFileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    useEffect(() => {
        fetchFileContent();
    }, []);

    const fetchFileContent = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await ConfigFileService.getFileContent();
            if (response.success) {
                setFileData(response.data);
                toast.success('Config file loaded');
            }
        } catch (error) {
            setError(error.response?.data?.message || 'Failed to load config file');
            toast.error('Failed to load config file');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (fileData?.content) {
            navigator.clipboard.writeText(fileData.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            toast.success('Copied to clipboard');
        }
    };

    const handleExport = () => {
        if (fileData?.content) {
            const blob = new Blob([fileData.content], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileData.fileName || 'config.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('File exported');
        }
    };

    const formatJSON = (content) => {
        try {
            return JSON.stringify(JSON.parse(content), null, 2);
        } catch {
            return content;
        }
    };

    return (
        <div className="user-events-page">
            {/* Floating Orbs */}
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />

            <motion.div
                className="calendar-header-control config-file-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1>
                    Config File Viewer
                </h1>
                <p>View and export configuration file content</p>
            </motion.div>

            <motion.div
                className="search-bar-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
            >
                {/* Mobile Filter Header */}
                <div className="mobile-filter-header" onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}>
                    <span><FileText size={16} /> Actions</span>
                    <button type="button" className="icon-btn">
                        {isMobileFilterOpen ? <X size={20} /> : <Filter size={20} />}
                    </button>
                </div>

                <div className={`search-form-wrapper ${isMobileFilterOpen ? 'open' : ''}`}>
                    <div className="config-file-info-container">
                        <div className="config-file-info">
                    {fileData && (
                        <>
                            <span className="config-file-name">
                                <FileText size={16} />
                                {fileData.fileName}
                            </span>
                            <span className="config-file-path">
                                {fileData.filePath}
                            </span>
                        </>
                    )}
                </div>
                <div className="config-actions-container">
                    <button
                        className="search-btn config-btn-refresh"
                        onClick={fetchFileContent}
                        disabled={loading}
                    >
                        {loading ? <RefreshCw className="spin" size={18} /> : <RefreshCw size={18} />}
                        Refresh
                    </button>
                    {fileData && (
                        <>
                            <button
                                className={`view-btn config-btn-copy ${copied ? 'copied' : ''}`}
                                onClick={handleCopy}
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button
                                className="view-btn config-btn-export"
                                onClick={handleExport}
                            >
                                <Download size={18} />
                                Export
                            </button>
                        </>
                    )}
                </div>
                    </div>
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
                        <span className="config-loading-icon">Loading config file...</span>
                    </div>
                ) : error ? (
                    <div className="no-data">
                        <AlertCircle size={32} className="config-error-icon" />
                        <div className="config-error-container">
                            <div className="config-error-title">Error loading file</div>
                            <div className="config-error-message">{error}</div>
                        </div>
                    </div>
                ) : fileData ? (
                    <div className="config-content-box">
                        <pre className="config-content-pre">
                            {formatJSON(fileData.content)}
                        </pre>
                    </div>
                ) : null}
            </motion.div>
        </div>
    );
};

export default ConfigFile;
