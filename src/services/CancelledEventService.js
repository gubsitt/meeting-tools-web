import api from './api'
import { API_CONFIG } from '../config/constants'

const CancelledEventService = {
    getCancelledTransactions: async ({ startTime, endTime, roomID, eventId }) => {
        try {
            const params = {};
            if (startTime) params.startTime = startTime;
            if (endTime) params.endTime = endTime;
            if (roomID) params.roomID = roomID;
            if (eventId) params.eventId = eventId;

            const response = await api.get(API_CONFIG.ENDPOINTS.CANCELLED_EVENTS, {
                params
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching cancelled transactions:", error);
            throw error;
        }
    },

    getEventOwner: async (eventId) => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.CANCELLED_EVENT_OWNER(eventId));
            return response.data;
        } catch (error) {
            console.error("Error fetching event owner:", error);
            throw error;
        }
    }
}

export default CancelledEventService
