import React from 'react';
import { Box } from 'lucide-react';

export function ModelEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center bg-[#151B2B] border border-slate-800 rounded-xl p-12 text-slate-500 text-center mt-6">
            <Box className="w-12 h-12 opacity-30 mb-4" />
            <p className="text-base font-medium text-slate-300">No models found</p>
            <p className="text-sm opacity-70 mt-1 max-w-sm">Fine-tune a model from a dataset, and it will appear here in the registry once completed.</p>
        </div>
    );
}
