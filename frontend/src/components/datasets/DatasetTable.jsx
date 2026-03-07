import React from 'react';
import { FileJson } from 'lucide-react';
import { Badge, ValidationIcon } from '../SharedUI';
import { DatasetEmptyState } from './DatasetEmptyState';

export function DatasetTable({ datasets }) {
    if (datasets.length === 0) {
        return <DatasetEmptyState />;
    }

    return (
        <div className="bg-[#151B2B] border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-[#0B0F19] border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="p-4 font-medium">Dataset Name</th>
                        <th className="p-4 font-medium">Size & Rows</th>
                        <th className="p-4 font-medium">Validation Status</th>
                        <th className="p-4 font-medium text-right">Uploaded</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                    {datasets.map(ds => (
                        <tr key={ds.id} className="hover:bg-slate-800/20 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <FileJson className="w-5 h-5 text-indigo-400" />
                                    <div>
                                        <p className="text-sm font-medium text-white">{ds.name}</p>
                                        <p className="text-xs text-slate-500">{ds.id}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-slate-300">
                                {ds.validation_report?.total_rows ? `${(ds.validation_report.total_rows).toLocaleString()} rows` : 'Pending'}
                            </td>
                            <td className="p-4">
                                <div className="flex flex-col gap-2">
                                    <Badge variant={ds.status === 'ready' ? 'green' : (ds.status === 'processing' ? 'indigo' : 'red')}>
                                        {ds.status === 'ready' ? 'Passed Checks' : (ds.status === 'processing' ? 'Validating...' : 'Failed Checks')}
                                    </Badge>
                                    {ds.validation_report ? (
                                        <div className="flex gap-2 mt-1">
                                            <ValidationIcon check={ds.validation_report.is_passed} title="JSON Format" />
                                            <ValidationIcon check={ds.validation_report.avg_tokens_per_row > 0} title="Token Limit" />
                                            <ValidationIcon check={ds.validation_report.duplicate_count === 0} title="Duplicates" />
                                            <ValidationIcon check={ds.validation_report.toxicity_score < 0.7} title="Toxicity Scan" />
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-slate-500 italic mt-1">Analysis in progress...</div>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 text-sm text-right text-slate-400">{new Date(ds.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
