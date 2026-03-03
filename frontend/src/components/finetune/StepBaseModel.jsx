import React from 'react';
import { Box } from 'lucide-react';

export function StepBaseModel({ formData, setFormData }) {
    const models = ['Llama 3.1 8B', 'Mistral 7B', 'Gemma 2 9B'];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h3 className="text-lg font-medium text-white mb-4">1. Select Base Model</h3>
            <div className="grid grid-cols-2 gap-4">
                {models.map(model => (
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
    );
}
