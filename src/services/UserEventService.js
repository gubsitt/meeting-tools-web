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

    getUserEvents: async (userId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/events/user/${userId}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching user events:", error);
            throw error;
        }
    }
}

export default UserEventService
