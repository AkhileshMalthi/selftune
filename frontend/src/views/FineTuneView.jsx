import React, { useState } from 'react';
import { jobsApi } from '../services/api';
import { StepBaseModel } from '../components/finetune/StepBaseModel';
import { StepDataset } from '../components/finetune/StepDataset';
import { StepHyperparameters } from '../components/finetune/StepHyperparameters';
import { FineTuneActions } from '../components/finetune/FineTuneActions';

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

    const validDatasets = datasets.filter(d => d.status === 'ready');

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
                    <StepBaseModel formData={formData} setFormData={setFormData} />
                )}

                {step === 2 && (
                    <StepDataset validDatasets={validDatasets} formData={formData} setFormData={setFormData} />
                )}

                {step === 3 && (
                    <StepHyperparameters formData={formData} setFormData={setFormData} />
                )}

                <FineTuneActions
                    step={step}
                    setStep={setStep}
                    navigate={navigate}
                    isSubmitting={isSubmitting}
                    submitError={submitError}
                    formData={formData}
                />
            </form>
        </div>
    );
}
