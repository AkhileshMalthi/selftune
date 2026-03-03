import React from 'react';
import { X, AlertCircle, Clock, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatusBadge, MetricCard } from '../SharedUI';
import { JobDetailsEmptyState } from './JobDetailsEmptyState';

export function JobDetails({ selectedJob }) {
    if (!selectedJob) {
        return <JobDetailsEmptyState />;
    }

    return (
        <div className="xl:col-span-2 border border-slate-800 bg-[#151B2B] rounded-xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-bold text-white">{selectedJob.name}</h2>
                        <StatusBadge status={selectedJob.status} />
                    </div>
                    <p className="text-sm text-slate-400">ID: {selectedJob.id} • Base: {selectedJob.model || selectedJob.baseModel} • Dataset: {selectedJob.dataset}</p>
                </div>

                {(selectedJob.status === 'running' || selectedJob.status === 'Running') && (
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
        </div>
    );
}
