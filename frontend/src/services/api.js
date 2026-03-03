import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically inject JWT token into all requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('selftune_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials).then(res => res.data),
    register: (userData) => api.post('/auth/register', userData).then(res => res.data),
};

export const datasetsApi = {
    getDatasets: () => api.get('/datasets').then(res => res.data),
    getPresignedUrl: (filename) => api.post('/datasets/presigned-url', { filename }).then(res => res.data),
    uploadToS3: (url, file) => axios.put(url, file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' }
    }),
    registerDataset: (s3Key) => api.post('/datasets/register', { s3Key }).then(res => res.data)
};

export const modelsApi = {
    getModels: () => api.get('/models').then(res => res.data),
};

export const jobsApi = {
    getJobs: () => api.get('/jobs').then(res => res.data),
    createJob: (data) => api.post('/jobs', data).then(res => res.data),
    getJobMetrics: (jobId) => api.get(`/jobs/${jobId}/metrics`).then(res => res.data),
    stopJob: (jobId) => api.post(`/jobs/${jobId}/stop`).then(res => res.data),
};

export const systemApi = {
    getHealth: () => api.get('/health').then(res => res.data),
};

export const userApi = {
    getProfile: () => api.get('/user/profile').then(res => res.data),
};

export default api;
