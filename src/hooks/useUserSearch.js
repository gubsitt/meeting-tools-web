import { useState, useEffect, useRef, useCallback } from 'react'
import { SEARCH_CONFIG } from '../config/constants'

/**
 * Custom hook for user search with API integration
 * @param {Object} searchService - Service object with searchUsers method
 * @returns {Object} User search state and handlers
 */
export default function useUserSearch(searchService) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [showDropdown, setShowDropdown] = useState(false)

    // Keep service in a ref so it never triggers useEffect re-runs
    const serviceRef = useRef(searchService)
    useEffect(() => { serviceRef.current = searchService }, [searchService])

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length >= SEARCH_CONFIG.MIN_SEARCH_LENGTH && !selectedUser) {
                try {
                    const res = await serviceRef.current.searchUsers(searchQuery)
                    if (res.success && res.data) {
                        setSearchResults(res.data)
                        setShowDropdown(true)
                    }
                } catch {
                    setSearchResults([])
                }
            } else {
                setSearchResults([])
                setShowDropdown(false)
            }
        }, SEARCH_CONFIG.DEBOUNCE_DELAY)

        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery, selectedUser]) // serviceRef is stable — no need in deps

    const handleSelectUser = useCallback((user) => {
        setSelectedUser(user)
        setSearchQuery(user.email)
        setShowDropdown(false)
    }, [])

    const handleClearSearch = useCallback(() => {
        setSearchQuery('')
        setSelectedUser(null)
        setSearchResults([])
        setShowDropdown(false)
    }, [])

    return {
        searchQuery,
        searchResults,
        selectedUser,
        showDropdown,
        setSearchQuery,
        setSelectedUser,
        handleSelectUser,
        handleClearSearch
    }
}
