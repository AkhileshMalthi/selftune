import React from 'react';
import { AlertCircle, Play, Clock } from 'lucide-react';

export function FineTuneActions({ step, setStep, navigate, isSubmitting, submitError, formData }) {
    return (
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
    );
}
