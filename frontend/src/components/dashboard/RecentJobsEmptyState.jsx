import React from 'react';
import { Activity } from 'lucide-react';

export function RecentJobsEmptyState({ navigate }) {
    return (
        <div className="bg-[#151B2B] border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-medium">Recent Jobs</h2>
                <button onClick={() => navigate('jobs')} className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
            </div>
            <div className="flex flex-col items-center justify-center text-slate-500 py-6">
                <Activity className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-sm font-medium">No recent jobs</p>
            </div>
        </div>
    );
}
