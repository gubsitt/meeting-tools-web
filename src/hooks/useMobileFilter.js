import { useState } from 'react'

/**
 * Custom hook for managing mobile filter toggle state
 * @param {boolean} initialState - Initial state for the filter (default: false)
 * @returns {Object} Filter state and handlers
 */
export default function useMobileFilter(initialState = false) {
    const [isOpen, setIsOpen] = useState(initialState)

    const toggle = () => {
        setIsOpen(prev => !prev)
    }

    const open = () => {
        setIsOpen(true)
    }

    const close = () => {
        setIsOpen(false)
    }

    return {
        isOpen,
        toggle,
        open,
        close,
        setIsOpen
    }
}
