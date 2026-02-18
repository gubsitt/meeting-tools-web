import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/components/Pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems }) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5; // Maximum number of page buttons to show

        if (totalPages <= maxVisible) {
            // Show all pages if total is less than max
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            // Adjust if at the beginning
            if (currentPage <= 3) {
                start = 2;
                end = 4;
            }

            // Adjust if at the end
            if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
                end = totalPages - 1;
            }

            // Add ellipsis after first page if needed
            if (start > 2) {
                pages.push('...');
            }

            // Add middle pages
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            // Add ellipsis before last page if needed
            if (end < totalPages - 1) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }

        return pages;
    };

    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="pagination-container">
            <div className="pagination-info">
                Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of <strong>{totalItems}</strong> results
            </div>

            <div className="pagination-controls">
                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft size={18} />
                    <span className="btn-text">Previous</span>
                </button>

                <div className="pagination-numbers">
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                        ) : (
                            <button
                                key={page}
                                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                                onClick={() => onPageChange(page)}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>

                <button
                    className="pagination-btn"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <span className="btn-text">Next</span>
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
