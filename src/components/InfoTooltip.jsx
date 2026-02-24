import { useState, useRef, useEffect } from 'react';
import { Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/components/InfoTooltip.css';

export default function InfoTooltip({ title, content, align = 'left' }) {
    const [isOpen, setIsOpen] = useState(false);
    const tooltipRef = useRef(null);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [isOpen]);

    return (
        <div className="info-tooltip-container" ref={tooltipRef}>
            <button
                className="info-tooltip-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Show information"
                title="Page Information"
            >
                <Info size={18} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={`info-tooltip-popover align-${align}`}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="info-tooltip-header">
                            <h4>{title || 'Information'}</h4>
                            <button
                                className="info-tooltip-close"
                                onClick={() => setIsOpen(false)}
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="info-tooltip-content">
                            {content}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
