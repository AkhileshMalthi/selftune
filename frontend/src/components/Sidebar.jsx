import React from 'react';
import { LayoutDashboard, Database, Activity, Box, Play } from 'lucide-react';
import { NavItem } from './SharedUI';

export function Sidebar({ activeTab, navigate, user, onLogout }) {
    return (
        <aside className="w-64 border-r border-slate-800 bg-[#0F1423] flex flex-col">
            <div className="p-6 flex items-center gap-3">
                <img src="/selftune.svg" alt="SelfTune Logo" className="w-8 h-8 drop-shadow-lg" />
                <span className="text-xl font-bold text-white tracking-tight">SelfTune</span>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => navigate('dashboard')} />
                <NavItem icon={<Database size={18} />} label="Datasets" active={activeTab === 'datasets'} onClick={() => navigate('datasets')} />
                <NavItem icon={<Play size={18} />} label="Fine-Tune" active={activeTab === 'finetune'} onClick={() => navigate('finetune')} />
                <NavItem icon={<Activity size={18} />} label="Jobs & Metrics" active={activeTab === 'jobs'} onClick={() => navigate('jobs')} />
                <NavItem icon={<Box size={18} />} label="Model Registry" active={activeTab === 'models'} onClick={() => navigate('models')} />
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors">
                    {user ? (
                        <>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                                {user.initials || (user.name ? user.name.charAt(0) : '?')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user.name || 'Unknown User'}</p>
                                <p className="text-xs text-slate-500 truncate">{user.email || 'No email provided'}</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (onLogout) onLogout(); }}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors ml-1"
                                title="Log Out"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            </button>
                        </>
                    ) : (
                        <div className="flex-1 min-w-0 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-slate-800 rounded animate-pulse w-3/4"></div>
                                <div className="h-2 bg-slate-800 rounded animate-pulse w-1/2"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
