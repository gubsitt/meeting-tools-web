/**
 * Utility functions for data formatting
 */

import moment from 'moment'
import { DATE_FORMAT } from '../config/constants'

/**
 * Format date to display format
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string (default: DD/MM/YYYY)
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = DATE_FORMAT.DISPLAY) => {
  if (!date) return '-'
  return moment(date).format(format)
}

/**
 * Format date with time
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date with time
 */
export const formatDateTime = (date) => {
  if (!date) return '-'
  return moment(date).format(DATE_FORMAT.DISPLAY_TIME)
}

/**
 * Format time only
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted time (HH:mm)
 */
export const formatTime = (date) => {
  if (!date) return '-'
  return moment(date).format('HH:mm')
}

/**
 * Get timestamp from date
 * @param {Date|string} date - Date to convert
 * @param {boolean} startOfDay - Whether to get start of day
 * @returns {number} Unix timestamp in milliseconds
 */
export const getTimestamp = (date, startOfDay = false) => {
  if (!date) return null
  const momentDate = moment(date)
  return startOfDay ? momentDate.startOf('day').valueOf() : momentDate.valueOf()
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-'
  return moment(date).fromNow()
}

/**
 * Check if date is today
 * @param {Date|string|number} date - Date to check
 * @returns {boolean}
 */
export const isToday = (date) => {
  if (!date) return false
  return moment(date).isSame(moment(), 'day')
}

/**
 * Check if date is in the past
 * @param {Date|string|number} date - Date to check
 * @returns {boolean}
 */
export const isPast = (date) => {
  if (!date) return false
  return moment(date).isBefore(moment())
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '-'
  return num.toLocaleString('en-US')
}

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

/**
 * Capitalize first letter
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export const capitalize = (text) => {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials (max 2 chars)
 */
export const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.split(' ')
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Parse timestamp object from API
 * @param {Object|number|string} timeValue - Time value from API
 * @returns {Date|null} JavaScript Date object
 */
export const parseTimestamp = (timeValue) => {
  if (!timeValue) return null
  
  // Handle object with unix property
  if (typeof timeValue === 'object' && timeValue.unix) {
    return new Date(timeValue.unix)
  }
  
  // Handle direct timestamp
  if (typeof timeValue === 'number') {
    return new Date(timeValue)
  }
  
  // Handle ISO string
  if (typeof timeValue === 'string') {
    return new Date(timeValue)
  }
  
  return null
}
