import React from 'react';
import { FileJson } from 'lucide-react';

export function DatasetEmptyState() {
    return (
        <div className="bg-[#151B2B] border border-slate-800 rounded-xl overflow-hidden p-8 text-center text-slate-500">
            <FileJson className="w-10 h-10 mx-auto opacity-30 mb-3" />
            <p className="text-sm font-medium">No datasets available</p>
            <p className="text-xs opacity-70 mt-1">Upload a JSONL file to get started.</p>
        </div>
    );
}
