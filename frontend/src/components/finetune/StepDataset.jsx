import React from 'react';
import { AlertCircle } from 'lucide-react';

export function StepDataset({ validDatasets, formData, setFormData }) {
    return (
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
                                <p className="text-xs text-slate-400 mt-1">{(ds.validation_report?.total_rows || 0).toLocaleString()} rows • Passed all validation checks</p>
                            </div>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
