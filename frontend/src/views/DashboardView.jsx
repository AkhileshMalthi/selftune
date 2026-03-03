import React from 'react';
import { Activity, Box, Server } from 'lucide-react';
import { StatCard } from '../components/SharedUI';
import { RecentJobs } from '../components/dashboard/RecentJobs';
import { DashboardActions } from '../components/dashboard/DashboardActions';

export function DashboardView({ jobs, models, clusterHealth, navigate }) {
    const activeJobs = jobs.filter(j => j.status === 'running' || j.status === 'queued').length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Active Training Jobs" value={activeJobs} icon={<Activity className="text-indigo-400" />} />
                <StatCard title="Ready Models" value={models.length} icon={<Box className="text-emerald-400" />} />
                <StatCard
                    title="Compute Cluster"
                    value={clusterHealth?.status || "Unknown"}
                    subtitle={clusterHealth ? `${clusterHealth.workersAvailable} Workers Available` : "Checking status..."}
                    icon={<Server className={clusterHealth?.status === 'Healthy' ? "text-emerald-400" : "text-blue-400"} />}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RecentJobs jobs={jobs} navigate={navigate} />
                <DashboardActions navigate={navigate} />
            </div>
        </div>
    );
}
