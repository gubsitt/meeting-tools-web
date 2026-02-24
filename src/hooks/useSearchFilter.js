import { useState, useEffect } from 'react'
import { SEARCH_CONFIG } from '../config/constants'

/**
 * Custom hook for search filter with debounce
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 500)
 * @returns {Object} Search state and handlers
 */
export default function useSearchFilter(debounceMs = SEARCH_CONFIG.DEBOUNCE_DELAY) {
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery)
        }, debounceMs)

        return () => {
            clearTimeout(handler)
        }
    }, [searchQuery, debounceMs])

    const clearSearch = () => {
        setSearchQuery('')
        setDebouncedQuery('')
    }

    return {
        searchQuery,
        setSearchQuery,
        debouncedQuery,
        clearSearch
    }
}
