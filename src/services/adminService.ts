import apiClient from './apiClient';

export const adminService = {
    getServices: async (params: { page?: number; limit?: number; search?: string; status?: string; type?: string }) => {
        return apiClient.get('/admin/services?' + new URLSearchParams(params as any).toString());
    },

    updateServiceStatus: async (id: string, status: 'active' | 'inactive' | 'pending' | 'rejected') => {
        return apiClient.patch(`/admin/services/${id}/status`, { status });
    },

    deleteService: async (id: string) => {
        return apiClient.delete(`/admin/services/${id}`);
    }
};
