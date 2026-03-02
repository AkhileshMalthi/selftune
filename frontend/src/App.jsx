import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Database, Activity, Box, Search, Play } from 'lucide-react';
import { NavItem } from './components/ui';
import { DashboardView } from './views/DashboardView';
import { DatasetsView } from './views/DatasetsView';
import { FineTuneView } from './views/FineTuneView';
import { JobsView } from './views/JobsView';
import { ModelsView } from './views/ModelsView';
import { datasetsApi, jobsApi, modelsApi, systemApi, userApi } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [datasets, setDatasets] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [models, setModels] = useState([]);
  const [clusterHealth, setClusterHealth] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app with a backend, we would fetch here
    // Example: 
    // Promise.all([datasetsApi.getDatasets(), jobsApi.getJobs(), modelsApi.getModels(), systemApi.getHealth(), userApi.getProfile()])
    //  .then(([ds, jb, md, health, profile]) => { setDatasets(ds); setJobs(jb); setModels(md); setClusterHealth(health); setUser(profile); setLoading(false); })
    //  .catch(err => { console.error("API Error", err); setLoading(false); });

    // For now, keep it empty and just disable loading
    setLoading(false);
  }, []);

  const navigate = (tab) => setActiveTab(tab);

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-indigo-500/30">
      {/* Sidebar */}
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
                  {user.initials || user.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
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

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && <DashboardView jobs={jobs} models={models} clusterHealth={clusterHealth} navigate={navigate} />}
            {activeTab === 'datasets' && <DatasetsView datasets={datasets} setDatasets={setDatasets} />}
            {activeTab === 'finetune' && <FineTuneView datasets={datasets} setJobs={setJobs} navigate={navigate} />}
            {activeTab === 'jobs' && <JobsView jobs={jobs} />}
            {activeTab === 'models' && <ModelsView models={models} />}
          </div>
        </div>
      </main>
    </div>
  );
}
