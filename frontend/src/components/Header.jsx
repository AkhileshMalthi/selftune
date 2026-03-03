import React from 'react';
import { Search } from 'lucide-react';

export function Header({ activeTab, onLogout }) {
    return (
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0B0F19]/80 backdrop-blur-sm z-10">
            <h1 className="text-lg font-medium text-white capitalize">{activeTab.replace('-', ' ')}</h1>
            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search models, jobs..."
                        className="bg-[#151B2B] border border-slate-800 text-sm rounded-full pl-9 pr-4 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-64 text-slate-200 placeholder-slate-500"
                    />
                </div>
                <button
                    onClick={onLogout}
                    className="md:hidden flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </button>
            </div>
        </header>
    );
}
