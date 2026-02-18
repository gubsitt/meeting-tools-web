import api from './api'
import { API_CONFIG } from '../config/constants'

const UserEventService = {
    searchUsers: async (query) => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.USERS_SEARCH, {
                params: { q: query }
            });
            return response.data;
        } catch (error) {
            console.error("Error searching users:", error);
            throw error;
        }
    },

    getUserEvents: async (filters) => {
        try {
            // filters: { userId, resourceId, startDate, endDate }
            const response = await api.get(API_CONFIG.ENDPOINTS.EVENTS_SEARCH, {
                params: filters
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching user events:", error);
            throw error;
        }
    },

    getUsersByIds: async (userIds) => {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.USERS_BY_IDS, {
                userIds
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching users by IDs:", error);
            throw error;
        }
    },

    updateEvent: async (eventId, updateData) => {
        try {
            const response = await api.put(API_CONFIG.ENDPOINTS.EVENTS_UPDATE(eventId), updateData);
            return response.data
        } catch (error) {
            console.error("Error updating event:", error);
            throw error;
        }
    }
}

export default UserEventService
