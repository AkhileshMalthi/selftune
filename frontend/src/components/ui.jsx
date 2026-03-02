import React from 'react';
import { Clock, Activity, CheckCircle2, AlertCircle } from 'lucide-react';

export const Badge = ({ children, variant = 'gray' }) => {
    const variants = {
        gray: 'bg-slate-800 text-slate-300 border-slate-700',
        green: 'bg-emerald-900/30 text-emerald-400 border-emerald-800',
        red: 'bg-rose-900/30 text-rose-400 border-rose-800',
        yellow: 'bg-amber-900/30 text-amber-400 border-amber-800',
        blue: 'bg-blue-900/30 text-blue-400 border-blue-800',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]}`}>
            {children}
        </span>
    );
};

export const NavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium
      ${active
                ? 'bg-indigo-600/10 text-indigo-400'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
    >
        {icon}
        {label}
    </button>
);

export const StatCard = ({ title, value, subtitle, icon }) => (
    <div className="bg-[#151B2B] border border-slate-800 rounded-xl p-6 flex items-start gap-4">
        <div className="p-3 bg-[#0B0F19] rounded-lg border border-slate-800">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-white">{value}</h3>
                {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
            </div>
        </div>
    </div>
);

export const ActionCard = ({ icon, title, desc, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center justify-center p-6 bg-[#0B0F19] border border-slate-800 rounded-xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all group text-left w-full h-full"
    >
        <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors mb-3">
            {icon}
        </div>
        <span className="text-sm font-medium text-white mb-1 block">{title}</span>
        <span className="text-xs text-slate-500 text-center block">{desc}</span>
    </button>
);

export const StatusBadge = ({ status, small = false }) => {
    const config = {
        queued: { color: 'gray', icon: Clock, text: 'Queued' },
        running: { color: 'blue', icon: Activity, text: 'Running' },
        completed: { color: 'green', icon: CheckCircle2, text: 'Completed' },
        failed: { color: 'red', icon: AlertCircle, text: 'Failed' },
    };
    const cfg = config[status.toLowerCase()] || config.queued;
    const Icon = cfg.icon;

    return (
        <div className={`flex items-center gap-1.5 ${small ? 'text-[10px]' : 'text-xs'}`}>
            <Badge variant={cfg.color}>
                <div className="flex items-center gap-1">
                    <Icon className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
                    {cfg.text}
                </div>
            </Badge>
        </div>
    );
};

export const ValidationIcon = ({ check, title }) => (
    <div className="group relative flex items-center justify-center cursor-help">
        {check ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
            <AlertCircle className="w-4 h-4 text-rose-500" />
        )}
        <div className="absolute bottom-full mb-2 hidden group-hover:block w-max bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow-lg z-10">
            {title}: {check ? 'Passed' : 'Failed'}
        </div>
    </div>
);

export const MetricCard = ({ label, value, trend }) => (
    <div className="bg-[#0B0F19] border border-slate-800 rounded-lg p-4">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        <div className="flex items-end gap-2">
            <h4 className="text-lg font-semibold text-white">{value}</h4>
            {trend === 'down' && <span className="text-[10px] text-emerald-400 mb-1 flex items-center">↓ 0.05</span>}
        </div>
    </div>
);
