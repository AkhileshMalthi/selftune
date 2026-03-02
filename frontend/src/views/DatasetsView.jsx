import React, { useState, useRef } from 'react';
import { UploadCloud, Clock, FileJson, AlertCircle } from 'lucide-react';
import { Badge, ValidationIcon } from '../components/ui';
import { datasetsApi } from '../services/api';

export function DatasetsView({ datasets, setDatasets }) {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Basic frontend validation for jsonl extension
        if (!file.name.endsWith('.jsonl')) {
            setUploadError('Only .jsonl files are supported.');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // 1. Get presigned URL and generated S3 Key from our backend
            const { uploadUrl, s3Key } = await datasetsApi.getPresignedUrl(file.name);

            // 2. Upload file directly to S3 via the presigned URL
            await datasetsApi.uploadToS3(uploadUrl, file);

            // 3. Notify backend that upload succeeded and trigger validation
            // The backend returns the newly created dataset object
            const newDataset = await datasetsApi.registerDataset(s3Key);

            // 4. Update UI state with the new dataset
            setDatasets(prev => [newDataset, ...prev]);
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadError(error.response?.data?.message || 'Failed to safely upload to S3.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">Datasets</h2>
                    <p className="text-sm text-slate-400">Manage and validate your training data</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <input
                        type="file"
                        accept=".jsonl"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {isUploading ? <Clock className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isUploading ? 'Uploading & Validating...' : 'Upload JSONL'}
                    </button>
                    {uploadError && (
                        <div className="text-rose-400 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {uploadError}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-[#151B2B] border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#0B0F19] border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">Dataset Name</th>
                            <th className="p-4 font-medium">Size & Rows</th>
                            <th className="p-4 font-medium">Validation Status</th>
                            <th className="p-4 font-medium text-right">Uploaded</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {datasets.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-slate-500">
                                    <FileJson className="w-10 h-10 mx-auto opacity-30 mb-3" />
                                    <p className="text-sm font-medium">No datasets available</p>
                                    <p className="text-xs opacity-70 mt-1">Upload a JSONL file to get started.</p>
                                </td>
                            </tr>
                        ) : (
                            datasets.map(ds => (
                                <tr key={ds.id} className="hover:bg-slate-800/20 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <FileJson className="w-5 h-5 text-indigo-400" />
                                            <div>
                                                <p className="text-sm font-medium text-white">{ds.name}</p>
                                                <p className="text-xs text-slate-500">{ds.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {ds.size} <span className="text-slate-500 mx-1">•</span> {ds.rows.toLocaleString()} rows
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-2">
                                            <Badge variant={ds.status === 'valid' ? 'green' : 'red'}>
                                                {ds.status === 'valid' ? 'Passed Checks' : 'Failed Checks'}
                                            </Badge>
                                            <div className="flex gap-2 mt-1">
                                                <ValidationIcon check={ds.validation.format} title="JSON Format" />
                                                <ValidationIcon check={ds.validation.tokens} title="Token Limit" />
                                                <ValidationIcon check={ds.validation.duplicates === 0} title="Duplicates" />
                                                <ValidationIcon check={!ds.validation.toxicity.includes('High')} title="Toxicity Scan" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-right text-slate-400">{ds.uploadedAt}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
