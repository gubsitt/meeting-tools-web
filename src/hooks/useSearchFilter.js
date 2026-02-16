import { useState, useEffect } from 'react'

/**
 * Custom hook for search filter with debounce
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 500)
 * @returns {Object} Search state and handlers
 */
export default function useSearchFilter(debounceMs = 500) {
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
