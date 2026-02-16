import { useState, useEffect } from 'react'

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

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.trim().length > 2 && !selectedUser) {
                try {
                    const res = await searchService.searchUsers(searchQuery)
                    if (res.success && res.data) {
                        setSearchResults(res.data)
                        setShowDropdown(true)
                    }
                } catch (error) {
                    console.error('Search error:', error)
                    setSearchResults([])
                }
            } else {
                setSearchResults([])
                setShowDropdown(false)
            }
        }, 500)

        return () => clearTimeout(delayDebounceFn)
    }, [searchQuery, selectedUser, searchService])

    const handleSelectUser = (user) => {
        setSelectedUser(user)
        setSearchQuery(user.email)
        setShowDropdown(false)
    }

    const handleClearSearch = () => {
        setSearchQuery('')
        setSelectedUser(null)
        setSearchResults([])
        setShowDropdown(false)
    }

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
