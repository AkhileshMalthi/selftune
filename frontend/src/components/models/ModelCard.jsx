import React from 'react';
import { Box } from 'lucide-react';
import { Badge } from '../../components/SharedUI';

export function ModelCard({ model, handleCopy }) {
    return (
        <div className="bg-[#151B2B] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all flex flex-col">
            <div className="p-5 border-b border-slate-800 bg-[#0B0F19]">
                <div className="flex justify-between items-start mb-2">
                    <Box className="w-8 h-8 text-indigo-400 mb-2" />
                    <Badge variant="blue">Ready</Badge>
                </div>
                <h3 className="text-lg font-medium text-white">{model.name}</h3>
                <p className="text-xs text-slate-400 mt-1">Base: {model.baseModel}</p>
            </div>

            <div className="p-5 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div>
                        <span className="text-slate-500 block text-xs mb-1">Created</span>
                        <span className="text-slate-300">{model.createdAt}</span>
                    </div>
                    <div>
                        <span className="text-slate-500 block text-xs mb-1">Eval Score</span>
                        <span className="text-emerald-400 font-medium">{model.accuracy}</span>
                    </div>
                </div>

                <div className="mt-auto">
                    <label className="text-xs font-medium text-slate-500 block mb-1">S3 Artifact URI</label>
                    <div className="flex items-center">
                        <input
                            type="text"
                            readOnly
                            value={model.s3Uri}
                            className="flex-1 bg-[#0B0F19] border border-slate-800 border-r-0 rounded-l-lg px-3 py-2 text-xs text-slate-400 outline-none"
                        />
                        <button
                            onClick={() => handleCopy(model.s3Uri)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-r-lg text-xs font-medium transition-colors"
                        >
                            Copy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
