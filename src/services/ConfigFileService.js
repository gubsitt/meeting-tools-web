import api from './api';
import { API_CONFIG } from '../config/constants';

const ConfigFileService = {
    getFileContent: async () => {
        try {
            const response = await api.get(API_CONFIG.ENDPOINTS.CONFIG_FILE_CONTENT, {
                params: { path: '/app/data/test.conf' }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching file content from container:', error);
            throw error;
        }
    },
};

export default ConfigFileService;
