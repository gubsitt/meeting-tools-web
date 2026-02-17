import api from './api';

const ConfigFileService = {
     getFileContent: async () => {
        try {
            const response = await api.get('/api/docker/container/file?path=/app/data/test.conf');
            return response.data;
        } catch (error) {
            console.error('Error fetching file content from container:', error);
            throw error;
        }
    },

};

export default ConfigFileService;
