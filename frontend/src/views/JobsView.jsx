import React, { useState } from 'react';
import { X, AlertCircle, Clock, ChevronRight, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatusBadge, MetricCard } from '../components/ui';

export function JobsView({ jobs }) {
    const [selectedJob, setSelectedJob] = useState(jobs[0] || null);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
            {/* Job List */}
            <div className="xl:col-span-1 border border-slate-800 bg-[#151B2B] rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-800 bg-[#0B0F19]">
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Experiment Queue</h2>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                    {jobs.length === 0 ? (
                        <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-500 text-center p-6">
                            <Activity className="w-10 h-10 opacity-30 mb-3" />
                            <p className="text-sm font-medium">No experiments queued</p>
                            <p className="text-xs opacity-70 mt-1 max-w-[200px]">Your training jobs will appear here once started.</p>
                        </div>
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

            {/* Job Details & Metrics */}
            <div className="xl:col-span-2 border border-slate-800 bg-[#151B2B] rounded-xl overflow-hidden flex flex-col">
                {selectedJob ? (
                    <>
                        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h2 className="text-xl font-bold text-white">{selectedJob.modelName}</h2>
                                    <StatusBadge status={selectedJob.status} />
                                </div>
                                <p className="text-sm text-slate-400">ID: {selectedJob.id} • Base: {selectedJob.baseModel} • Dataset: {selectedJob.dataset}</p>
                            </div>

                            {selectedJob.status === 'running' && (
                                <button className="px-3 py-1.5 border border-rose-900/50 bg-rose-900/20 text-rose-400 text-sm rounded-lg hover:bg-rose-900/40 transition-colors flex items-center gap-2">
                                    <X className="w-4 h-4" /> Stop
                                </button>
                            )}
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {selectedJob.status === 'failed' ? (
                                <div className="p-4 rounded-lg bg-rose-900/10 border border-rose-900/30 text-rose-400 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-sm">Job Failed</h4>
                                        <p className="text-sm opacity-80 mt-1">{selectedJob.error}</p>
                                    </div>
                                </div>
                            ) : selectedJob.status === 'queued' ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                                    <Clock className="w-12 h-12 opacity-50" />
                                    <p>Waiting for an available worker node...</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-4 gap-4">
                                        <MetricCard label="Current Epoch" value={`${selectedJob.epoch} / ${selectedJob.totalEpochs}`} />
                                        <MetricCard label="Training Loss" value={selectedJob.loss?.toFixed(4) || '--'} trend="down" />
                                        <MetricCard label="Est. Time Left" value={selectedJob.status === 'completed' ? '0s' : '45m 12s'} />
                                        <MetricCard label="GPU Mem Usage" value="14.2 GB" />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-white">Training Metrics (Weights & Biases)</h3>
                                        </div>
                                        <div className="h-72 w-full bg-[#0B0F19] rounded-xl border border-slate-800 p-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={selectedJob.lossHistory || []} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                                    <XAxis dataKey="step" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                                        itemStyle={{ color: '#e2e8f0' }}
                                                    />
                                                    <Line type="monotone" dataKey="train_loss" name="Train Loss" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                                    <Line type="monotone" dataKey="val_loss" name="Val Loss" stroke="#10b981" strokeWidth={2} dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {selectedJob.status === 'completed' && (
                                        <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-4">
                                            <h3 className="text-sm font-medium text-white mb-2">Artifacts Saved</h3>
                                            <p className="text-xs text-slate-400 mb-4">Model adapters have been successfully pushed to the registry.</p>
                                            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                                                View in Registry <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                        Select a job to view metrics
                    </div>
                )}
            </div>
        </div>
    );
}
