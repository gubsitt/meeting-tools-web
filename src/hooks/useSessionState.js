import { useState, useEffect } from 'react';

/**
 * A custom hook that works like useState but persists the state to sessionStorage.
 * @param {string} key - The sessionStorage key
 * @param {any} initialValue - The initial value if no value exists in sessionStorage
 * @returns {[any, function]} - State value and setter function
 */
export default function useSessionState(key, initialValue) {
    // Pass initial state function to useState so logic is only executed once
    const [state, setState] = useState(() => {
        if (!key) return (typeof initialValue === 'function' ? initialValue() : initialValue);

        try {
            const item = sessionStorage.getItem(key);
            if (item !== null) {
                return JSON.parse(item);
            }
        } catch (error) {
            console.warn(`Error reading sessionStorage key "${key}":`, error);
        }
        return (typeof initialValue === 'function' ? initialValue() : initialValue);
    });

    // Update sessionStorage when state changes
    useEffect(() => {
        if (!key) return;

        try {
            sessionStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.warn(`Error setting sessionStorage key "${key}":`, error);
        }
    }, [key, state]);

    return [state, setState];
}
