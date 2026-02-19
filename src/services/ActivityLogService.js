import api from './api'

const ActivityLogService = {
    getActivityLogs: async (params) => {
        try {
            const response = await api.get('/api/activity-logs', { params })
            return response.data
        } catch (error) {
            throw error
        }
    }
}

export default ActivityLogService
