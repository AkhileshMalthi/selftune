import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
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
                    <div key={job.id} className="group flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-[#0B0F19] hover:border-indigo-500/50 transition-colors cursor-pointer" onClick={() => navigate('jobs')}>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <p className="text-sm font-medium text-white truncate">{job.modelName}</p>
                                <StatusBadge status={job.status} small />
                            </div>
                            <p className="text-xs text-slate-500 truncate">{job.baseModel} • Epoch {job.epoch}/{job.totalEpochs}</p>
                        </div>

                        {/* Mini Sparkline Chart */}
                        {job.lossHistory && (
                            <div className="w-24 h-8 mx-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={job.lossHistory}>
                                        <Line
                                            type="monotone"
                                            dataKey="train_loss"
                                            stroke={job.status === 'failed' ? '#ef4444' : '#8b5cf6'}
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        <div className="text-right whitespace-nowrap">
                            <p className="text-sm font-medium text-white">{job.loss ? job.loss.toFixed(4) : '--'}</p>
                            <p className="text-[10px] text-slate-500">Loss</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
