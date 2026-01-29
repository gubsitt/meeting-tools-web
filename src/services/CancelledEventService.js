import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

const CancelledEventService = {
    getCancelledTransactions: async (startTime, endTime, roomId) => {
        try {
            const params = {};
            if (startTime) params.startTime = startTime;
            if (endTime) params.endTime = endTime;
            if (roomId) params.roomID = roomId;

            const response = await axios.get(`${API_BASE_URL}/cancelled-events`, {
                params,
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching cancelled transactions:", error);
            throw error;
        }
    },

    getEventOwner: async (eventId) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/cancelled-events/event-owner/${eventId}`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching event owner:", error);
            throw error;
        }
    }
}

export default CancelledEventService
