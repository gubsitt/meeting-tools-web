import api from './api';

const MissSyncService = {
    getMissSyncEvents: async (startDate, endDate) => {
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await api.get('/api/events/miss-sync', { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching miss sync events:', error);
            throw error;
        }
    },

    updateMissSyncEvent: async (eventId, data) => {
        try {
            const response = await api.put(`/api/events/miss-sync/${eventId}`, data);
            return response.data;
        } catch (error) {
            console.error('Error updating miss sync event:', error);
            throw error;
        }
    },

    syncMissingSyncIds: async (eventId) => {
        try {
            const response = await api.post(`/api/events/miss-sync/sync/${eventId}`);
            return response.data;
        } catch (error) {
            console.error('Error syncing missing sync IDs:', error);
            throw error;
        }
    }
};

export default MissSyncService;

