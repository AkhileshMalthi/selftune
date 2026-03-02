import React, { useState } from 'react';
import { Box, AlertCircle, Play, Clock } from 'lucide-react';
import { jobsApi } from '../services/api';

export function FineTuneView({ datasets, setJobs, navigate }) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        baseModel: 'Llama 3.1 8B',
        dataset: '',
        strategy: 'LoRA',
        learningRate: '2e-4',
        epochs: 3,
        loraRank: 16
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // Replace mock generation with the real backend API call
            const newJob = await jobsApi.createJob({
                ...formData,
                modelName: formData.name || `${formData.baseModel}-finetuned`
            });
            setJobs(prev => [newJob, ...prev]);
            navigate('jobs');
        } catch (error) {
            console.error("Job submission failed:", error);
            setSubmitError(error.response?.data?.message || 'Failed to submit training job.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const validDatasets = datasets.filter(d => d.status === 'valid');

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Create Fine-Tuning Job</h2>
                <p className="text-slate-400">Configure your model, dataset, and hyperparameters to queue a new training task.</p>
            </div>

            <div className="flex items-center mb-8">
                {[1, 2, 3].map((num) => (
                    <React.Fragment key={num}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= num ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>
                            {num}
                        </div>
                        {num < 3 && <div className={`flex-1 h-px mx-4 ${step > num ? 'bg-indigo-600' : 'bg-slate-800'}`} />}
                    </React.Fragment>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="bg-[#151B2B] border border-slate-800 rounded-xl p-8">
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h3 className="text-lg font-medium text-white mb-4">1. Select Base Model</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {['Llama 3.1 8B', 'Mistral 7B', 'Gemma 2 9B'].map(model => (
                                <div
                                    key={model}
                                    onClick={() => setFormData({ ...formData, baseModel: model })}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${formData.baseModel === model ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-[#0B0F19] hover:border-slate-500'}`}
                                >
                                    <Box className={`w-6 h-6 mb-3 ${formData.baseModel === model ? 'text-indigo-400' : 'text-slate-400'}`} />
                                    <p className="font-medium text-white">{model}</p>
                                    <p className="text-xs text-slate-500 mt-1">Standard context window, instruct tuned.</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-slate-400 mb-2">Custom Model Name (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. customer-support-bot"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h3 className="text-lg font-medium text-white mb-4">2. Choose Dataset</h3>
                        {validDatasets.length === 0 ? (
                            <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-800/50 text-amber-400 text-sm flex gap-3">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                <p>No valid datasets available. Please upload and validate a JSONL dataset first.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {validDatasets.map(ds => (
                                    <label key={ds.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${formData.dataset === ds.name ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-[#0B0F19] hover:border-slate-500'}`}>
                                        <input
                                            type="radio"
                                            name="dataset"
                                            value={ds.name}
                                            checked={formData.dataset === ds.name}
                                            onChange={(e) => setFormData({ ...formData, dataset: e.target.value })}
                                            className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                                        />
                                        <div>
                                            <p className="font-medium text-white">{ds.name}</p>
                                            <p className="text-xs text-slate-400 mt-1">{ds.rows.toLocaleString()} rows • Passed all validation checks</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                        <h3 className="text-lg font-medium text-white mb-4">3. Hyperparameters</h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Training Strategy</label>
                                <select
                                    value={formData.strategy}
                                    onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="LoRA">LoRA (Parameter Efficient)</option>
                                    <option value="QLoRA">QLoRA (4-bit Quantized)</option>
                                    <option value="Full">Full Fine-Tuning (Requires heavy compute)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Epochs ({formData.epochs})</label>
                                <input
                                    type="range" min="1" max="10" step="1"
                                    value={formData.epochs}
                                    onChange={(e) => setFormData({ ...formData, epochs: parseInt(e.target.value) })}
                                    className="w-full accent-indigo-500 mt-3"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Learning Rate</label>
                                <input
                                    type="text"
                                    value={formData.learningRate}
                                    onChange={(e) => setFormData({ ...formData, learningRate: e.target.value })}
                                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">LoRA Rank (r)</label>
                                <select
                                    value={formData.loraRank}
                                    onChange={(e) => setFormData({ ...formData, loraRank: parseInt(e.target.value) })}
                                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="8">8 (Faster, less expressive)</option>
                                    <option value="16">16 (Balanced)</option>
                                    <option value="32">32 (Slower, highly expressive)</option>
                                    <option value="64">64 (Max capacity)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-800">
                    {submitError && (
                        <div className="mb-4 p-3 rounded-lg bg-rose-900/10 border border-rose-900/30 text-rose-400 text-sm flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>{submitError}</p>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <button
                            type="button"
                            onClick={() => step > 1 ? setStep(step - 1) : navigate('dashboard')}
                            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>

                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={() => setStep(step + 1)}
                                disabled={step === 2 && !formData.dataset}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <><Clock className="w-4 h-4 animate-spin" /> Submitting...</>
                                ) : (
                                    <><Play className="w-4 h-4 fill-current" /> Submit Training Job</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
}
