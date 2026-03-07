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

// Handle unauthorized responses globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Check if this was a login request (where 401 is an expected user error)
            const isLoginRequest = error.config.url.includes('/auth/login');

            if (!isLoginRequest) {
                console.warn("Session expired or invalid. Logging out...");
                localStorage.removeItem('selftune_token');
                // Force a reload to clear all app state and trigger Auth Guard
                window.location.reload();
            }
        }
        return Promise.reject(error);
    }
);

export const ENDPOINTS = {
    auth: {
        login: '/auth/login',
        register: '/auth/register',
    },
    datasets: {
        base: '/datasets',
        presignedUrl: '/datasets/presigned-url',
        register: '/datasets/register',
        multipartInitiate: '/datasets/multipart/initiate',
        multipartPresign: '/datasets/multipart/presign',
        multipartComplete: '/datasets/multipart/complete',
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
        profile: '/auth/me',
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

// Helper to rewrite internal docker minio URL to localhost for the host browser
const fixS3Url = (url) => {
    if (url && url.includes('minio:9000')) {
        return url.replace('minio:9000', 'localhost:9000');
    }
    return url;
};

export const datasetsApi = {
    getDatasets: () => api.get(ENDPOINTS.datasets.base).then(res => res.data),
    getPresignedUrl: (filename) => api.post(ENDPOINTS.datasets.presignedUrl, { filename }).then(res => res.data),
    uploadToS3: (url, file) => axios.put(fixS3Url(url), file, {
        headers: { 'Content-Type': 'application/x-ndjson' }
    }),
    uploadPartToS3: (url, chunk) => axios.put(fixS3Url(url), chunk, {
        headers: { 'Content-Type': 'application/x-ndjson' }
    }),
    registerDataset: (data) => api.post(ENDPOINTS.datasets.register, {
        s3_key: data.s3Key,
        name: data.name,
        original_filename: data.originalFilename
    }).then(res => res.data),
    multipartInitiate: (filename) => api.post(ENDPOINTS.datasets.multipartInitiate, { filename }).then(res => res.data),
    multipartPresign: (data) => api.post(ENDPOINTS.datasets.multipartPresign, {
        s3_key: data.s3Key,
        upload_id: data.uploadId,
        part_numbers: data.partNumbers
    }).then(res => res.data),
    multipartComplete: (data) => api.post(ENDPOINTS.datasets.multipartComplete, {
        s3_key: data.s3Key,
        upload_id: data.uploadId,
        name: data.name,
        original_filename: data.originalFilename,
        parts: data.parts
    }).then(res => res.data),
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
