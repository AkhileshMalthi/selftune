export const initialDatasets = [
    { id: 1, name: 'customer_support_q_a.jsonl', status: 'Valid', size: '2.4 MB', date: '2026-03-01', rows: 15420, format: 'JSONL' },
    { id: 2, name: 'code_generation_snippets.jsonl', status: 'Valid', size: '1.8 MB', date: '2026-02-28', rows: 8400, format: 'JSONL' },
    { id: 3, name: 'medical_terminology.csv', status: 'Error', size: '14.2 MB', date: '2026-02-27', rows: 0, format: 'CSV' },
    { id: 4, name: 'product_reviews_sentiment.jsonl', status: 'Valid', size: '5.1 MB', date: '2026-02-26', rows: 32000, format: 'JSONL' }
];

export const initialJobs = [
    { id: 'job-9f8a2c', name: 'Support Bot V2', model: 'Mistral-7B-v0.1', dataset: 'customer_support_q_a.jsonl', status: 'Training', progress: 68, epoch: '2/3', loss: 0.142, timeRemaining: '45m' },
    { id: 'job-4b3e1a', name: 'Code Assistant Base', model: 'Llama-3-8B', dataset: 'code_generation_snippets.jsonl', status: 'Completed', progress: 100, epoch: '3/3', loss: 0.084, timeRemaining: '-' },
    { id: 'job-7d5f0b', name: 'Medical Entity Extractor', model: 'Phi-3-Mini-4K', dataset: 'medical_terminology.csv', status: 'Failed', progress: 12, epoch: '0/3', loss: null, timeRemaining: '-' }
];

export const initialModels = [
    { id: 'mod-1', name: 'Llama-3-8B', type: 'Base Model', size: '8B', jobs: 24, parameters: '8.03B', uri: 's3://selftune-weights/base/llama-3-8b', ready: true },
    { id: 'mod-2', name: 'Mistral-7B-v0.1', type: 'Base Model', size: '7B', jobs: 56, parameters: '7.24B', uri: 's3://selftune-weights/base/mistral-7b-v0.1', ready: true },
    { id: 'mod-3', name: 'Code Assistant Base (job-4b3e1a)', type: 'Fine-Tuned', size: '8B', jobs: 0, parameters: '8.03B', uri: 's3://selftune-weights/finetuned/job-4b3e1a/checkpoints/final', ready: true }
];
