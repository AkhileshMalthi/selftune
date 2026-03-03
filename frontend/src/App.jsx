import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
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
    Promise.all([
      datasetsApi.getDatasets().catch(() => []),
      jobsApi.getJobs().catch(() => []),
      modelsApi.getModels().catch(() => []),
      systemApi.getHealth().catch(() => ({ status: 'Unknown', workersAvailable: 0 })),
      userApi.getProfile().catch(() => null)
    ])
      .then(([ds, jb, md, health, profile]) => {
        setDatasets(ds || []);
        setJobs(jb || []);
        setModels(md || []);
        setClusterHealth(health);
        setUser(profile);
        setLoading(false);
      })
      .catch(err => {
        console.error("API initialization error:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0B0F19] items-center justify-center text-slate-400">
        <div className="animate-pulse">Loading platform...</div>
      </div>
    );
  }

  const navigate = (tab) => setActiveTab(tab);

  return (
    <div className="flex h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-indigo-500/30">
      <Sidebar activeTab={activeTab} navigate={navigate} user={user} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header activeTab={activeTab} />

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
