import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const adminService = {
    getServices: async (params: { page?: number; limit?: number; search?: string; status?: string; type?: string }) => {
        const response = await axios.get(`${API_URL}/admin/services`, {
            params,
            headers: getAuthHeader(),
        });
        return response.data;
    },

    updateServiceStatus: async (id: string, status: 'active' | 'inactive' | 'pending') => {
        const response = await axios.patch(`${API_URL}/admin/services/${id}/status`, { status }, {
            headers: getAuthHeader(),
        });
        return response.data;
    },

    deleteService: async (id: string) => {
        const response = await axios.delete(`${API_URL}/admin/services/${id}`, {
            headers: getAuthHeader(),
        });
        return response.data;
    }
};
