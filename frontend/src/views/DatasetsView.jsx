import React, { useState, useRef } from 'react';
import { datasetsApi } from '../services/api';
import { DatasetHeader } from '../components/datasets/DatasetHeader';
import { DatasetTable } from '../components/datasets/DatasetTable';

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
            <DatasetHeader
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                handleUploadClick={handleUploadClick}
                isUploading={isUploading}
                uploadError={uploadError}
            />

            <DatasetTable datasets={datasets} />
        </div>
    );
}
