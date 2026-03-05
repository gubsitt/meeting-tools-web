import api from './api';
import { API_CONFIG } from '../config/constants';

const CompareEventService = {
    getCompareEvents: async ({ roomEmail, startDate, endDate, top, view }) => {
        try {
            const params = { roomEmail };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            if (top) params.top = top;
            if (view) params.view = view;

            const response = await api.get(API_CONFIG.ENDPOINTS.COMPARE_EVENTS, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching compare events:', error);
            throw error;
        }
    },
};

export default CompareEventService;
