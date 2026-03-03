import React from 'react';
import { UploadCloud, Clock, AlertCircle } from 'lucide-react';

export function DatasetHeader({ fileInputRef, handleFileChange, handleUploadClick, isUploading, uploadError }) {
    return (
        <div className="flex justify-between items-center bg-[#0B0F19]">
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
    );
}
