import axios from 'axios'

// กำหนด URL ตรงนี้เลย (อย่าลืมใส่ /api ต่อท้ายนะครับ)
const API_BASE_URL = 'http://localhost:5000/api'

const CalendarService = {
  getEvents: async (roomEmail, startDate, endDate) => {
    try {
      // ยิง Axios ตรงๆ
      const response = await axios.get(`${API_BASE_URL}/calendar/events`, {
        params: {
          roomEmail,
          startDate,
          endDate
        },
        // 👇 [สำคัญมาก] ต้องใส่บรรทัดนี้ ไม่งั้น Backend จะมองว่าไม่ได้ Login
        withCredentials: true 
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

deleteEvent: async (eventId) => {
    try {
      // ยิง DELETE ไปที่ /api/calendar/events/:id
      const response = await axios.delete(`${API_BASE_URL}/calendar/events/${eventId}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

export default CalendarService