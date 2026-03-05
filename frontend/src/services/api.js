import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

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

export const ENDPOINTS = {
    auth: {
        login: '/auth/login',
        register: '/auth/register',
    },
    datasets: {
        base: '/datasets',
        presignedUrl: '/datasets/presigned-url',
        register: '/datasets/register',
    },
    models: {
        base: '/models',
    },
    jobs: {
        base: '/jobs',
        metrics: (id) => `/jobs/${id}/metrics`,
        stop: (id) => `/jobs/${id}/stop`,
    },
    system: {
        health: '/health',
    },
    user: {
        profile: '/user/profile',
    }
};

export const authApi = {
    login: ({ email, password }) => {
        // OAuth2 password flow requires form-urlencoded with `username` field
        const form = new URLSearchParams();
        form.append('username', email);
        form.append('password', password);
        return api.post(ENDPOINTS.auth.login, form, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }).then(res => res.data);
    },
    register: (userData) => api.post(ENDPOINTS.auth.register, userData).then(res => res.data),
};

export const datasetsApi = {
    getDatasets: () => api.get(ENDPOINTS.datasets.base).then(res => res.data),
    getPresignedUrl: (filename) => api.post(ENDPOINTS.datasets.presignedUrl, { filename }).then(res => res.data),
    uploadToS3: (url, file) => axios.put(url, file, {
        headers: { 'Content-Type': file.type || 'application/octet-stream' }
    }),
    registerDataset: (s3Key) => api.post(ENDPOINTS.datasets.register, { s3Key }).then(res => res.data)
};

export const modelsApi = {
    getModels: () => api.get(ENDPOINTS.models.base).then(res => res.data),
};

export const jobsApi = {
    getJobs: () => api.get(ENDPOINTS.jobs.base).then(res => res.data),
    createJob: (data) => api.post(ENDPOINTS.jobs.base, data).then(res => res.data),
    getJobMetrics: (jobId) => api.get(ENDPOINTS.jobs.metrics(jobId)).then(res => res.data),
    stopJob: (jobId) => api.post(ENDPOINTS.jobs.stop(jobId)).then(res => res.data),
};

export const systemApi = {
    getHealth: () => api.get(ENDPOINTS.system.health).then(res => res.data),
};

export const userApi = {
    getProfile: () => api.get(ENDPOINTS.user.profile).then(res => res.data),
};

export default api;
