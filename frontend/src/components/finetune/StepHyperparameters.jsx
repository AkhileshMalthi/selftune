import React from 'react';

export function StepHyperparameters({ formData, setFormData }) {
    return (
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
    );
}
