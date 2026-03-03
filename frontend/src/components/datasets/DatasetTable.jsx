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
                            <td className="p-4 text-sm">
                                {ds.size} <span className="text-slate-500 mx-1">•</span> {ds.rows.toLocaleString()} rows
                            </td>
                            <td className="p-4">
                                <div className="flex flex-col gap-2">
                                    <Badge variant={ds.status === 'valid' ? 'green' : 'red'}>
                                        {ds.status === 'valid' ? 'Passed Checks' : 'Failed Checks'}
                                    </Badge>
                                    <div className="flex gap-2 mt-1">
                                        <ValidationIcon check={ds.validation.format} title="JSON Format" />
                                        <ValidationIcon check={ds.validation.tokens} title="Token Limit" />
                                        <ValidationIcon check={ds.validation.duplicates === 0} title="Duplicates" />
                                        <ValidationIcon check={!ds.validation.toxicity.includes('High')} title="Toxicity Scan" />
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-right text-slate-400">{ds.uploadedAt}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
