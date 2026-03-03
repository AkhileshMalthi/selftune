import React from 'react';
import { Activity } from 'lucide-react';

export function JobQueueEmptyState() {
    return (
        <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-500 text-center p-6">
            <Activity className="w-10 h-10 opacity-30 mb-3" />
            <p className="text-sm font-medium">No experiments queued</p>
            <p className="text-xs opacity-70 mt-1 max-w-[200px]">Your training jobs will appear here once started.</p>
        </div>
    );
}
