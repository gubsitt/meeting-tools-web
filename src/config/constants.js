/**
 * Application Constants & Configuration
 * Centralized configuration for the entire application
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  ENDPOINTS: {
    // Auth
    AUTH_ME: '/api/auth/me',
    AUTH_LOGOUT: '/api/auth/logout',
    AUTH_USERS: '/api/auth/users',
    AUTH_UPDATE_ROLE: (userId) => `/api/auth/users/${userId}/role`,
    AUTH_DELETE_USER: (userId) => `/api/auth/users/${userId}`,
    
    // Calendar
    CALENDAR_EVENTS: '/api/calendar/events',
    CALENDAR_DELETE_EVENT: (eventId) => `/api/calendar/events/${eventId}`,
    
    // Events
    EVENTS_SEARCH: '/api/events/search',
    EVENTS_UPDATE: (eventId) => `/api/events/${eventId}`,
    
    // Users
    USERS_SEARCH: '/api/users/search',
    USERS_BY_IDS: '/api/users/by-ids',
    
    // Cancelled Events
    CANCELLED_EVENTS: '/api/cancelled-events',
    CANCELLED_EVENT_OWNER: (eventId) => `/api/cancelled-events/event-owner/${eventId}`,
    
    // Miss Sync Events
    MISS_SYNC_EVENTS: '/api/miss-sync-events',
    
    // Config File
    CONFIG_FILE: '/api/config'
  }
}

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'superadmin'
}

// Pagination Configuration
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
}

// Date Format
export const DATE_FORMAT = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  LOCALE: 'en-GB'
}

// Event Status
export const EVENT_STATUS = {
  SCHEDULED: 'scheduled',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
}

// Toast Configuration
export const TOAST_CONFIG = {
  POSITION: 'top-right',
  DURATION: 3000,
  STYLE: {
    background: 'rgba(22, 33, 62, 0.95)',
    backdropFilter: 'blur(10px)',
    color: '#fff',
    border: '1px solid rgba(108, 92, 231, 0.2)',
    borderLeft: '6px solid #6c5ce7',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
    fontSize: '0.95rem',
    maxWidth: '400px',
  },
  SUCCESS: {
    iconTheme: {
      primary: '#00b894',
      secondary: '#fff',
    },
    style: {
      borderLeft: '6px solid #00b894',
      background: 'rgba(22, 33, 62, 0.95)',
    }
  },
  ERROR: {
    iconTheme: {
      primary: '#ff7675',
      secondary: '#fff',
    },
    style: {
      borderLeft: '6px solid #ff7675',
      background: 'rgba(22, 33, 62, 0.95)',
    }
  }
}

// Search Configuration
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 500,
  MIN_SEARCH_LENGTH: 3
}

// Local Storage Keys
export const STORAGE_KEYS = {
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
  AUTH_TOKEN: 'authToken',
  USER_PREFERENCES: 'userPreferences'
}

// Calendar Configuration
export const CALENDAR_CONFIG = {
  DEFAULT_VIEW: 'month',
  VIEWS: ['month', 'week', 'day', 'agenda'],
  STEP: 30, // minutes
  TIME_SLOTS: 2
}

// Theme Colors
export const THEME = {
  PRIMARY: '#6c5ce7',
  SECONDARY: '#a29bfe',
  SUCCESS: '#00b894',
  ERROR: '#ff7675',
  WARNING: '#fdcb6e',
  INFO: '#74b9ff',
  DARK: '#2d3436',
  LIGHT: '#dfe6e9'
}
