import { http, HttpResponse } from 'msw';

const API_BASE_URL = '/api/v1';

export const handlers = [
    // Mock Login
    http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
        const formData = await request.formData();
        const email = formData.get('username');

        if (email === 'error@selftune.app') {
            return new HttpResponse(null, { status: 401 });
        }

        return HttpResponse.json({
            access_token: 'fake-jwt-token',
            token_type: 'bearer'
        });
    }),

    // Mock Profile
    http.get(`${API_BASE_URL}/auth/me`, () => {
        return HttpResponse.json({
            id: 1,
            email: 'test@selftune.app',
            name: 'Test UI User',
            initials: 'TU',
            is_active: true
        });
    }),

    // Mock Datasets
    http.get(`${API_BASE_URL}/datasets`, () => {
        return HttpResponse.json([
            {
                id: 1,
                name: 'Training Dataset A',
                original_filename: 'train_a.jsonl',
                status: 'ready',
                validation_report: { total_rows: 1500, valid: true }
            },
            {
                id: 2,
                name: 'Evaluation Dataset B',
                original_filename: 'eval_b.jsonl',
                status: 'ready',
                validation_report: { total_rows: 500, valid: true }
            }
        ]);
    }),

    // Mock Models
    http.get(`${API_BASE_URL}/models`, () => {
        return HttpResponse.json([
            { id: 'llama-3-8b', name: 'Llama 3 8B' },
            { id: 'mistral-7b', name: 'Mistral 7B' }
        ]);
    }),

    // Mock Jobs
    http.get(`${API_BASE_URL}/jobs`, () => {
        return HttpResponse.json([]);
    }),

    http.post(`${API_BASE_URL}/jobs`, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json({
            id: 101,
            name: body.name || `${body.baseModel}-finetuned`,
            dataset_id: body.dataset_id,
            model_type: body.model_type,
            status: 'pending',
            epoch: 0,
            totalEpochs: body.epochs || 3,
            progress: 0,
            created_at: new Date().toISOString()
        });
    }),

    // Mock System Health
    http.get(`${API_BASE_URL}/health`, () => {
        return HttpResponse.json({ status: 'OK', workersAvailable: 4 });
    })
];
