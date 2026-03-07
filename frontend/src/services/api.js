import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Automatically inject JWT token into all requests
const DEMO_MODE = true; // Set to false to use real backend

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('selftune_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Demo Data
const MOCK_DATASETS = [
    {
        id: "ds_7v2kL90",
        name: "customer_support_v2",
        original_filename: "support_history.jsonl",
        status: "valid",
        size: "14.2 MB",
        rows: 12500,
        uploadedAt: "2026-03-07",
        validation: {
            format: true,
            tokens: true,
            duplicates: 0,
            toxicity: ["None"]
        }
    },
    {
        id: "ds_4x9mP21",
        name: "physics_equations_base",
        original_filename: "equations.jsonl",
        status: "valid",
        size: "2.1 MB",
        rows: 850,
        uploadedAt: "2026-03-06",
        validation: {
            format: true,
            tokens: true,
            duplicates: 0,
            toxicity: ["None"]
        }
    }
];

const MOCK_JOBS = [
    {
        id: "job_9921",
        model_name: "Llama-3-8B-Base",
        dataset_name: "customer_support_v2",
        status: "completed",
        progress: 100,
        metrics: { loss: 0.12, accuracy: 0.94 },
        created_at: "2026-03-07T10:00:00Z"
    },
    {
        id: "job_9845",
        model_name: "Mistral-7B-v0.3",
        dataset_name: "physics_equations_base",
        status: "running",
        progress: 68,
        metrics: { loss: 0.45, accuracy: 0.81 },
        created_at: "2026-03-07T14:30:00Z"
    }
];

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
    getDatasets: () => {
        if (DEMO_MODE) return Promise.resolve(MOCK_DATASETS);
        return api.get(ENDPOINTS.datasets.base).then(res => res.data);
    },
    getPresignedUrl: (filename) => {
        if (DEMO_MODE) return Promise.resolve({ upload_url: "http://demo/upload", s3_key: "demo.jsonl" });
        return api.post(ENDPOINTS.datasets.presignedUrl, { filename }).then(res => res.data);
    },
    uploadToS3: (url, file) => {
        if (DEMO_MODE) return Promise.resolve({ status: 200 });
        return axios.put(fixS3Url(url), file, {
            headers: { 'Content-Type': 'application/x-ndjson' }
        });
    },
    uploadPartToS3: (url, chunk) => axios.put(fixS3Url(url), chunk, {
        headers: { 'Content-Type': 'application/x-ndjson' }
    }),
    registerDataset: (data) => {
        if (DEMO_MODE) {
            const newDs = {
                id: "ds_" + Math.random().toString(36).substr(2, 7),
                name: data.name,
                original_filename: data.originalFilename,
                status: "valid",
                size: "0.1 MB",
                rows: 10,
                uploadedAt: new Date().toISOString().split('T')[0],
                validation: { format: true, tokens: true, duplicates: 0, toxicity: ["None"] }
            };
            MOCK_DATASETS.unshift(newDs);
            return Promise.resolve(newDs);
        }
        return api.post(ENDPOINTS.datasets.register, {
            s3_key: data.s3Key,
            name: data.name,
            original_filename: data.originalFilename
        }).then(res => res.data);
    },
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
    getJobs: () => {
        if (DEMO_MODE) return Promise.resolve(MOCK_JOBS);
        return api.get(ENDPOINTS.jobs.base).then(res => res.data);
    },
    createJob: (data) => {
        if (DEMO_MODE) {
            const newJob = {
                id: "job_" + Math.floor(Math.random() * 9000 + 1000),
                model_name: data.model_id,
                dataset_name: MOCK_DATASETS.find(d => d.id === data.dataset_id)?.name || "Unknown",
                status: "running",
                progress: 0,
                metrics: { loss: 0.0, accuracy: 0.0 },
                created_at: new Date().toISOString()
            };
            MOCK_JOBS.unshift(newJob);
            return Promise.resolve(newJob);
        }
        return api.post(ENDPOINTS.jobs.base, data).then(res => res.data);
    },
    getJobMetrics: (jobId) => {
        if (DEMO_MODE) return Promise.resolve({ loss: [0.9, 0.7, 0.5, 0.3], accuracy: [0.4, 0.6, 0.8, 0.9] });
        return api.get(ENDPOINTS.jobs.metrics(jobId)).then(res => res.data);
    },
    stopJob: (jobId) => api.post(ENDPOINTS.jobs.stop(jobId)).then(res => res.data),
};

export const systemApi = {
    getHealth: () => api.get(ENDPOINTS.system.health).then(res => res.data),
};

export const userApi = {
    getProfile: () => api.get(ENDPOINTS.user.profile).then(res => res.data),
};

export default api;
