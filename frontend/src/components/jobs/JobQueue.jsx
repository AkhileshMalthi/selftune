import React from 'react';
import { StatusBadge } from '../SharedUI';
import { JobQueueEmptyState } from './JobQueueEmptyState';

export function JobQueue({ jobs, selectedJob, setSelectedJob }) {
    return (
        <div className="xl:col-span-1 border border-slate-800 bg-[#151B2B] rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-[#0B0F19]">
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Experiment Queue</h2>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {jobs.length === 0 ? (
                    <JobQueueEmptyState />
                ) : (
                    jobs.map(job => (
                        <div
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className={`p-4 rounded-lg cursor-pointer transition-all border ${selectedJob?.id === job.id ? 'bg-[#1E2638] border-indigo-500/50' : 'bg-transparent border-transparent hover:bg-slate-800/50'}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-sm font-medium text-white truncate pr-2">{job.modelName}</h3>
                                <StatusBadge status={job.status} small />
                            </div>
                            <p className="text-xs text-slate-400 mb-3">{job.id} • {job.startedAt}</p>

                            {(job.status === 'running' || job.status === 'completed') && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Epoch {job.epoch}/{job.totalEpochs}</span>
                                        <span className="text-slate-300">{job.progress}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${job.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${job.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
