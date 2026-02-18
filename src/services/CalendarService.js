import api from './api'
import { API_CONFIG } from '../config/constants'

const CalendarService = {
  getEvents: async (roomEmail, startDate, endDate, search) => {
    try {
      const response = await api.get(API_CONFIG.ENDPOINTS.CALENDAR_EVENTS, {
        params: {
          roomEmail,
          startDate,
          endDate,
          search
        }
      });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteEvent: async (eventId, roomEmail) => {
    try {
      const response = await api.delete(API_CONFIG.ENDPOINTS.CALENDAR_DELETE_EVENT(eventId), {
        data: { roomEmail }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default CalendarService