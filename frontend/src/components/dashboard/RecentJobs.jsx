import React from 'react';
import { StatusBadge } from '../SharedUI';
import { RecentJobsEmptyState } from './RecentJobsEmptyState';

export function RecentJobs({ jobs, navigate }) {
    if (jobs.length === 0) {
        return <RecentJobsEmptyState navigate={navigate} />;
    }

    return (
        <div className="bg-[#151B2B] border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-white font-medium">Recent Jobs</h2>
                <button onClick={() => navigate('jobs')} className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
            </div>
            <div className="space-y-4">
                {jobs.slice(0, 3).map(job => (
                    <div key={job.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-[#0B0F19]">
                        <div>
                            <p className="text-sm font-medium text-white">{job.modelName}</p>
                            <p className="text-xs text-slate-500 mt-1">{job.baseModel} • {job.startedAt}</p>
                        </div>
                        <StatusBadge status={job.status} />
                    </div>
                ))}
            </div>
        </div>
    );
}
