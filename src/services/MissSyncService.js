import api from './api';
import { API_CONFIG } from '../config/constants';

const MissSyncService = {
    getMissSyncEvents: async ({ startDate, endDate, eventId, roomId }) => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (eventId) params.eventId = eventId;
            if (roomId) params.roomId = roomId;

            const response = await api.get(API_CONFIG.ENDPOINTS.MISS_SYNC_EVENTS, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching miss sync events:', error);
            throw error;
        }
    },

    updateMissSyncEvent: async (eventId, data) => {
        try {
            const response = await api.put(API_CONFIG.ENDPOINTS.MISS_SYNC_EVENT_UPDATE(eventId), data);
            return response.data;
        } catch (error) {
            console.error('Error updating miss sync event:', error);
            throw error;
        }
    },

    syncMissingSyncIds: async (eventId) => {
        try {
            const response = await api.post(API_CONFIG.ENDPOINTS.MISS_SYNC_EVENT_SYNC(eventId));
            return response.data;
        } catch (error) {
            console.error('Error syncing missing sync IDs:', error);
            throw error;
        }
    }
};

export default MissSyncService;
