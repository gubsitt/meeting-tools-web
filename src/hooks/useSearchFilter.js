import { useState, useEffect } from 'react'
import { SEARCH_CONFIG } from '../config/constants'
import useSessionState from './useSessionState'

/**
 * Custom hook for search filter with debounce
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 500)
 * @param {string} storageKeyPrefix - Prefix for sessionStorage keys
 * @returns {Object} Search state and handlers
 */
export default function useSearchFilter(debounceMs = SEARCH_CONFIG.DEBOUNCE_DELAY, storageKeyPrefix = '') {
    const queryKey = storageKeyPrefix ? `${storageKeyPrefix}_searchQuery` : null

    const [searchQuery, setSearchQuery] = useSessionState(queryKey, '')
    const [debouncedQuery, setDebouncedQuery] = useState(searchQuery)

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
