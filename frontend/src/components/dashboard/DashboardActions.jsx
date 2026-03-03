import React from 'react';
import { Plus, UploadCloud } from 'lucide-react';
import { ActionCard } from '../SharedUI';

export function DashboardActions({ navigate }) {
    return (
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
    );
}
