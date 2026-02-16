import api from './api';

const ConfigFileService = {
    getFileContent: async () => {
        try {
            const response = await api.get('/api/docker/file/content');
            return response.data;
        } catch (error) {
            console.error('Error fetching file content:', error);
            throw error;
        }
    }
};

export default ConfigFileService;
