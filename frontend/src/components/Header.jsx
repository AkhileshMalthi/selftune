import React from 'react';
import { Search } from 'lucide-react';

export function Header({ activeTab }) {
    return (
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0B0F19]/80 backdrop-blur-sm z-10">
            <h1 className="text-lg font-medium text-white capitalize">{activeTab.replace('-', ' ')}</h1>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search models, jobs..."
                        className="bg-[#151B2B] border border-slate-800 text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-64 text-slate-200 placeholder-slate-500"
                    />
                </div>
            </div>
        </header>
    );
}
