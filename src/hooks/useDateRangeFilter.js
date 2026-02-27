import { useState, useCallback } from 'react'
import useSessionState from './useSessionState'

/**
 * Custom hook for managing date range filter
 * @param {string} initialStart - Initial start date
 * @param {string} initialEnd - Initial end date
 * @param {string} storageKeyPrefix - Prefix for sessionStorage keys
 * @returns {Object} Date range state and handlers
 */
export default function useDateRangeFilter(initialStart = '', initialEnd = '', storageKeyPrefix = '') {
    const startKey = storageKeyPrefix ? `${storageKeyPrefix}_startDate` : null
    const endKey = storageKeyPrefix ? `${storageKeyPrefix}_endDate` : null

    const [startDate, setStartDate] = useSessionState(startKey, initialStart)
    const [endDate, setEndDate] = useSessionState(endKey, initialEnd)

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
