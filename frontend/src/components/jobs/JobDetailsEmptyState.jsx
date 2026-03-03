import React from 'react';
import { BarChart3 } from 'lucide-react';

export function JobDetailsEmptyState() {
    return (
        <div className="xl:col-span-2 border border-slate-800 bg-[#151B2B] rounded-xl overflow-hidden flex flex-col items-center justify-center text-slate-500 p-12 text-center">
            <BarChart3 className="w-12 h-12 opacity-30 mb-4" />
            <p className="text-base font-medium text-slate-300">No job selected</p>
            <p className="text-sm opacity-70 mt-1 max-w-sm">Select an experiment from the queue to view its training metrics, loss charts, and artifacts.</p>
        </div>
    );
}
