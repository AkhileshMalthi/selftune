import { http, HttpResponse } from 'msw';
import { initialDatasets, initialJobs, initialModels } from '../data/mockData';

// Helper to interact with LocalStorage as a pseudo-database
const db = {
    get: (key, fallback) => {
        try {
            const data = localStorage.getItem(`selftune_mock_${key}`);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            return fallback;
        }
    },
    set: (key, value) => {
        localStorage.setItem(`selftune_mock_${key}`, JSON.stringify(value));
    }
};

// Seed database on first load
if (!localStorage.getItem('selftune_mock_seeded')) {
    db.set('users', []);
    db.set('datasets', initialDatasets);
    db.set('jobs', initialJobs);
    db.set('models', initialModels);
    db.set('seeded', true);
}

const API_BASE = '/api';

export const handlers = [
    // --- AUTHENTICATION ---
    http.post(`${API_BASE}/auth/register`, async ({ request }) => {
        const body = await request.json();
        const users = db.get('users', []);

        if (users.find(u => u.email === body.email)) {
            return HttpResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const newUser = { ...body, id: Date.now().toString() };
        db.set('users', [...users, newUser]);

        return HttpResponse.json({
            token: `mock_jwt_token_for_${newUser.email}`,
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });
    }),

    http.post(`${API_BASE}/auth/login`, async ({ request }) => {
        const body = await request.json();
        const users = db.get('users', []);

        const user = users.find(u => u.email === body.email && u.password === body.password);

        if (!user) {
            return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        return HttpResponse.json({
            token: `mock_jwt_token_for_${user.email}`,
            user: { id: user.id, name: user.name, email: user.email }
        });
    }),

    // --- USER PROFILE ---
    http.get(`${API_BASE}/user/profile`, ({ request }) => {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer mock_jwt_token_for_')) {
            return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const email = authHeader.replace('Bearer mock_jwt_token_for_', '');
        const users = db.get('users', []);
        const user = users.find(u => u.email === email);

        if (!user) return HttpResponse.json({ message: 'User not found' }, { status: 404 });

        return HttpResponse.json({ name: user.name, email: user.email, initials: user.name.charAt(0).toUpperCase() });
    }),

    // --- DATASETS ---
    http.get(`${API_BASE}/datasets`, () => {
        return HttpResponse.json(db.get('datasets', []));
    }),

    http.post(`${API_BASE}/datasets/presigned-url`, async ({ request }) => {
        const { filename } = await request.json();
        return HttpResponse.json({
            uploadUrl: `https://mock-s3-bucket.localhost/upload/${filename}`,
            key: `raw/${Date.now()}_${filename}`
        });
    }),

    // Intercept the direct-to-S3 PUT request
    http.put('https://mock-s3-bucket.localhost/upload/:filename', async () => {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 1500));
        return new HttpResponse(null, { status: 200 });
    }),

    http.post(`${API_BASE}/datasets/register`, async ({ request }) => {
        const { s3Key } = await request.json();
        const datasets = db.get('datasets', []);

        const newDataset = {
            id: datasets.length + 1,
            name: s3Key.split('_').pop(),
            status: 'Processing',
            size: 'Unknown (Mock)',
            date: new Date().toISOString().split('T')[0],
            rows: 0,
            format: 'JSONL'
        };

        db.set('datasets', [newDataset, ...datasets]);

        // Simulate background processing
        setTimeout(() => {
            const currentData = db.get('datasets', []);
            const updatedData = currentData.map(d =>
                d.id === newDataset.id ? { ...d, status: 'Valid', rows: 12500 } : d
            );
            db.set('datasets', updatedData);
        }, 3000);

        return HttpResponse.json(newDataset);
    }),

    // --- JOBS ---
    http.get(`${API_BASE}/jobs`, () => {
        return HttpResponse.json(db.get('jobs', []));
    }),

    http.post(`${API_BASE}/jobs`, async ({ request }) => {
        const body = await request.json();
        const jobs = db.get('jobs', []);

        const newJob = {
            id: `job-${Math.random().toString(36).substr(2, 6)}`,
            name: `Fine-tune ${body.baseModel} on ${body.dataset}`,
            model: body.baseModel,
            dataset: body.dataset,
            status: 'Pending',
            progress: 0,
            epoch: '0/3',
            loss: null,
            timeRemaining: 'Calculating...'
        };

        db.set('jobs', [newJob, ...jobs]);
        return HttpResponse.json(newJob);
    }),

    // --- MODELS ---
    http.get(`${API_BASE}/models`, () => {
        return HttpResponse.json(db.get('models', []));
    }),

    // --- SYSTEM ---
    http.get(`${API_BASE}/health`, () => {
        return HttpResponse.json({
            status: 'Healthy',
            workersAvailable: 4,
            uptime: '99.9%',
            activeJobs: db.get('jobs', []).filter(j => j.status === 'Training').length
        });
    }),
];
