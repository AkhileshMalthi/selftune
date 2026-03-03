import React from 'react';
import { ModelCard } from '../components/models/ModelCard';
import { ModelEmptyState } from '../components/models/ModelEmptyState';
export function ModelsView({ models }) {
    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        // In a real app, show a toast notification here
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-white mb-2">Model Registry</h2>
                <p className="text-slate-400">Manage your deployed adapters and base models.</p>
            </div>

            {models.length === 0 ? (
                <ModelEmptyState />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {models.map(model => (
                        <ModelCard key={model.id} model={model} handleCopy={handleCopy} />
                    ))}
                </div>
            )}
        </div>
    );
}
