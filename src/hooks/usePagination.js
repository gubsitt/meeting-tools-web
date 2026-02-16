import { useState, useMemo } from 'react'

/**
 * Custom hook for handling pagination logic
 * @param {Array} data - The array of data to paginate
 * @param {number} itemsPerPage - Number of items per page (default: 10)
 * @returns {Object} Pagination state and handlers
 */
export default function usePagination(data = [], itemsPerPage = 10) {
    const [currentPage, setCurrentPage] = useState(1)

    // Calculate pagination values
    const paginationData = useMemo(() => {
        const totalPages = Math.ceil(data.length / itemsPerPage)
        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = startIndex + itemsPerPage
        const paginatedData = data.slice(startIndex, endIndex)

        return {
            paginatedData,
            totalPages,
            startIndex,
            endIndex,
            totalItems: data.length
        }
    }, [data, currentPage, itemsPerPage])

    const handlePageChange = (page) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const resetPagination = () => {
        setCurrentPage(1)
    }

    return {
        currentPage,
        itemsPerPage,
        ...paginationData,
        handlePageChange,
        resetPagination,
        setCurrentPage
    }
}
