import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

const UserEventService = {
    searchUsers: async (query) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/users/search`, {
                params: { q: query },
                withCredentials: true
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
            const response = await axios.get(`${API_BASE_URL}/events/search`, {
                params: filters,
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching user events:", error);
            throw error;
        }
    },

    getUsersByIds: async (userIds) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/users/by-ids`, {
                userIds
            }, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching users by IDs:", error);
            throw error;
        }
    },

    updateEvent: async (eventId, updateData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/events/${eventId}`, updateData, {
                withCredentials: true
            });
            return response.data
        } catch (error) {
            console.error("Error updating event:", error);
            throw error;
        }
    }
}

export default UserEventService
