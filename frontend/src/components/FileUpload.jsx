import { useState, useRef } from 'react';

export default function FileUpload({ isOpen, onClose, onUploadComplete }) {
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadFile, setUploadFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('');
    const [statusType, setStatusType] = useState('');
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    };

    const handleFile = async (file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'txt'].includes(ext)) {
            setStatus('Only PDF and TXT files are supported');
            setStatusType('error');
            return;
        }

        setUploadFile(file);
        setUploading(true);
        setProgress(0);
        setStatus('Uploading...');
        setStatusType('');

        try {
            // Simulate progress during upload
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Upload failed');
            }

            setProgress(100);
            setStatus('Upload successful! Processing document...');
            setStatusType('success');

            setTimeout(() => {
                onUploadComplete();
                resetState();
                onClose();
            }, 1500);
        } catch (err) {
            setStatus(`Error: ${err.message}`);
            setStatusType('error');
            setUploading(false);
        }
    };

    const resetState = () => {
        setUploadFile(null);
        setUploading(false);
        setProgress(0);
        setStatus('');
        setStatusType('');
    };

    const handleClose = () => {
        if (!uploading) {
            resetState();
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>📄 Upload Document</h3>
                    <button className="modal-close" onClick={handleClose}>✕</button>
                </div>
                <div className="modal-body">
                    <div
                        className={`dropzone ${isDragging ? 'active' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        <div className="drop-icon">📁</div>
                        <h4>Drop your file here</h4>
                        <p>or click to browse • PDF, TXT up to 50MB</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />

                    {uploadFile && (
                        <div className="upload-progress">
                            <div className="upload-file-name">
                                📎 {uploadFile.name}
                            </div>
                            <div className="progress-bar">
                                <div
                                    className="progress-bar-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            {status && (
                                <div className={`upload-status ${statusType}`}>{status}</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
