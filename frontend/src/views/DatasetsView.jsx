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

        const datasetName = file.name.replace('.jsonl', '');
        const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100 MB

        try {
            let newDataset;

            if (file.size < MULTIPART_THRESHOLD) {
                // --- Simple Upload Flow (< 100MB) ---
                console.log('Using simple upload flow...');
                const { upload_url, s3_key } = await datasetsApi.getPresignedUrl(file.name);

                // Upload directly to S3
                await datasetsApi.uploadToS3(upload_url, file);

                // Register dataset
                newDataset = await datasetsApi.registerDataset({
                    s3Key: s3_key,
                    name: datasetName,
                    originalFilename: file.name
                });
            } else {
                // --- Multipart Upload Flow (>= 100MB) ---
                console.log('Using multipart upload flow...');

                // 1. Initiate
                const { s3_key, upload_id } = await datasetsApi.multipartInitiate(file.name);

                // 2. Calculate parts (10MB per part)
                const PART_SIZE = 10 * 1024 * 1024;
                const totalParts = Math.ceil(file.size / PART_SIZE);
                const partNumbers = Array.from({ length: totalParts }, (_, i) => i + 1);

                // 3. Get expected URLs
                const { parts: presignedUrls } = await datasetsApi.multipartPresign({
                    s3Key: s3_key,
                    uploadId: upload_id,
                    partNumbers
                });

                // 4. Upload parts with concurrency (e.g. 4 at a time)
                const CONCURRENCY = 4;
                const uploadedParts = [];
                let currentIndex = 0;

                const uploadWorker = async () => {
                    while (currentIndex < totalParts) {
                        const partIdx = currentIndex++;
                        const partNum = partNumbers[partIdx];
                        const start = partIdx * PART_SIZE;
                        const end = Math.min(start + PART_SIZE, file.size);
                        const chunk = file.slice(start, end);

                        const url = presignedUrls[partNum];
                        const res = await datasetsApi.uploadPartToS3(url, chunk);

                        // S3 returns ETag in headers
                        uploadedParts.push({
                            part_number: partNum,
                            etag: res.headers.etag.replace(/"/g, '') // Axios sometimes leaves quotes
                        });
                    }
                };

                // Run workers
                await Promise.all(
                    Array.from({ length: Math.min(CONCURRENCY, totalParts) }, uploadWorker)
                );

                // Sort parts just in case
                uploadedParts.sort((a, b) => a.part_number - b.part_number);

                // 5. Complete
                newDataset = await datasetsApi.multipartComplete({
                    s3Key: s3_key,
                    uploadId: upload_id,
                    name: datasetName,
                    originalFilename: file.name,
                    parts: uploadedParts
                });
            }

            // 4. Update UI state with the new dataset
            setDatasets(prev => [newDataset, ...prev]);
        } catch (error) {
            console.error("Upload failed:", error);
            setUploadError(error.response?.data?.detail || error.message || 'Failed to safely upload to S3.');
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
