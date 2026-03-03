import React, { useState } from 'react';
import { JobQueue } from '../components/jobs/JobQueue';
import { JobDetails } from '../components/jobs/JobDetails';

export function JobsView({ jobs }) {
    const [selectedJob, setSelectedJob] = useState(jobs[0] || null);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
            <JobQueue
                jobs={jobs}
                selectedJob={selectedJob}
                setSelectedJob={setSelectedJob}
            />

            <JobDetails
                selectedJob={selectedJob}
            />
        </div>
    );
}
