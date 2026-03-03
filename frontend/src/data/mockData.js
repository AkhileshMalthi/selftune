export const initialDatasets = [
    { id: 1, name: 'customer_support_q_a.jsonl', status: 'Valid', size: '2.4 MB', date: '2026-03-01', rows: 15420, format: 'JSONL' },
    { id: 2, name: 'code_generation_snippets.jsonl', status: 'Valid', size: '1.8 MB', date: '2026-02-28', rows: 8400, format: 'JSONL' },
    { id: 3, name: 'medical_terminology.csv', status: 'Error', size: '14.2 MB', date: '2026-02-27', rows: 0, format: 'CSV' },
    { id: 4, name: 'product_reviews_sentiment.jsonl', status: 'Valid', size: '5.1 MB', date: '2026-02-26', rows: 32000, format: 'JSONL' }
];

// Generate a realistic looking loss curve
const generateLossHistory = (steps, startLoss, endLoss) => {
    return Array.from({ length: steps }, (_, i) => {
        const progress = i / (steps - 1);
        // Exponential decay curve with some random noise
        const baseLoss = startLoss * Math.exp(-3 * progress) + (endLoss * progress);
        const noise = (Math.random() - 0.5) * 0.05 * baseLoss;
        return {
            step: i * 50,
            train_loss: Number((baseLoss + noise).toFixed(4)),
            val_loss: Number((baseLoss * 1.1 + noise).toFixed(4))
        };
    });
};

export const initialJobs = [
    {
        id: 'job-9f8a2c',
        name: 'Support Bot V2',
        modelName: 'Support Bot V2',
        baseModel: 'Mistral-7B-v0.1',
        dataset: 'customer_support_q_a.jsonl',
        status: 'running',
        progress: 68,
        epoch: 2,
        totalEpochs: 3,
        loss: 0.142,
        timeRemaining: '45m',
        lossHistory: generateLossHistory(20, 2.5, 0.142)
    },
    {
        id: 'job-4b3e1a',
        name: 'Code Assistant Base',
        modelName: 'Code Assistant Base',
        baseModel: 'Llama-3-8B',
        dataset: 'code_generation_snippets.jsonl',
        status: 'completed',
        progress: 100,
        epoch: 3,
        totalEpochs: 3,
        loss: 0.084,
        timeRemaining: '-',
        lossHistory: generateLossHistory(40, 2.8, 0.084)
    },
    {
        id: 'job-7d5f0b',
        name: 'Medical Entity Extractor',
        modelName: 'Medical Entity Extractor',
        baseModel: 'Phi-3-Mini-4K',
        dataset: 'medical_terminology.csv',
        status: 'failed',
        progress: 12,
        epoch: 0,
        totalEpochs: 3,
        loss: null,
        timeRemaining: '-',
        error: 'CUDA Out of Memory exception during gradient accumulation step 45.'
    },
    {
        id: 'job-1x9k4p',
        name: 'Legal Doc Summarizer',
        modelName: 'Legal Doc Summarizer',
        baseModel: 'Llama-3-8B',
        dataset: 'legal_contracts_v2.jsonl',
        status: 'queued',
        progress: 0,
        epoch: 0,
        totalEpochs: 5,
        loss: null,
        timeRemaining: 'Waiting...'
    }
];

export const initialModels = [
    { id: 'mod-1', name: 'Llama-3-8B', type: 'Base Model', size: '8B', jobs: 24, parameters: '8.03B', uri: 's3://selftune-weights/base/llama-3-8b', ready: true },
    { id: 'mod-2', name: 'Mistral-7B-v0.1', type: 'Base Model', size: '7B', jobs: 56, parameters: '7.24B', uri: 's3://selftune-weights/base/mistral-7b-v0.1', ready: true },
    { id: 'mod-3', name: 'Code Assistant Base (job-4b3e1a)', type: 'Fine-Tuned', size: '8B', jobs: 0, parameters: '8.03B', uri: 's3://selftune-weights/finetuned/job-4b3e1a/checkpoints/final', ready: true }
];
