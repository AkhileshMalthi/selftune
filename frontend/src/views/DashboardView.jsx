import React from 'react';
import { Activity, Box, Server, Plus, UploadCloud } from 'lucide-react';
import { StatCard, ActionCard, StatusBadge } from '../components/ui';

export function DashboardView({ jobs, models, clusterHealth, navigate }) {
    const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued').length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Active Training Jobs" value={activeJobs} icon={<Activity className="text-indigo-400" />} />
                <StatCard title="Ready Models" value={models.length} icon={<Box className="text-emerald-400" />} />
                <StatCard
                    title="Compute Cluster"
                    value={clusterHealth?.status || "Unknown"}
                    subtitle={clusterHealth ? `${clusterHealth.workersAvailable} Workers Available` : "Checking status..."}
                    icon={<Server className={clusterHealth?.status === 'Healthy' ? "text-emerald-400" : "text-blue-400"} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Jobs */}
                <div className="bg-[#151B2B] border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-white font-medium">Recent Jobs</h2>
                        <button onClick={() => navigate('jobs')} className="text-sm text-indigo-400 hover:text-indigo-300">View All</button>
                    </div>
                    <div className="space-y-4">
                        {jobs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-slate-500 py-6">
                                <Activity className="w-8 h-8 opacity-30 mb-2" />
                                <p className="text-sm font-medium">No recent jobs</p>
                            </div>
                        ) : (
                            jobs.slice(0, 3).map(job => (
                                <div key={job.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-[#0B0F19]">
                                    <div>
                                        <p className="text-sm font-medium text-white">{job.modelName}</p>
                                        <p className="text-xs text-slate-500 mt-1">{job.baseModel} • {job.startedAt}</p>
                                    </div>
                                    <StatusBadge status={job.status} />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-[#151B2B] border border-slate-800 rounded-xl p-6">
                    <h2 className="text-white font-medium mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <ActionCard
                            icon={<Plus />}
                            title="New Fine-Tune"
                            desc="Start a new training job"
                            onClick={() => navigate('finetune')}
                        />
                        <ActionCard
                            icon={<UploadCloud />}
                            title="Upload Dataset"
                            desc="Add and validate JSONL"
                            onClick={() => navigate('datasets')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
