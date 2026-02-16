import { useState, useCallback } from 'react'

/**
 * Custom hook for managing date range filter
 * @param {string} initialStart - Initial start date
 * @param {string} initialEnd - Initial end date
 * @returns {Object} Date range state and handlers
 */
export default function useDateRangeFilter(initialStart = '', initialEnd = '') {
    const [startDate, setStartDate] = useState(initialStart)
    const [endDate, setEndDate] = useState(initialEnd)

    const handleDateChange = useCallback((field, value) => {
        if (field === 'start') {
            setStartDate(value)
        } else if (field === 'end') {
            setEndDate(value)
        }
    }, [])

    const isValidRange = useCallback(() => {
        if (!startDate || !endDate) return false
        return new Date(startDate) <= new Date(endDate)
    }, [startDate, endDate])

    const resetDates = useCallback(() => {
        setStartDate(initialStart)
        setEndDate(initialEnd)
    }, [initialStart, initialEnd])

    const dateRange = {
        start: startDate,
        end: endDate
    }

    return {
        startDate,
        endDate,
        setStartDate,
        setEndDate,
        dateRange,
        handleDateChange,
        isValidRange,
        resetDates
    }
}
