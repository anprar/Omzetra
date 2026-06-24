"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    const isCsv = selectedFile.name.endsWith('.csv');
    const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
    
    if (!isCsv && !isExcel) {
      setError('Format file tidak didukung. Silakan gunakan .csv atau Excel (.xlsx)');
      setFile(null);
      return;
    }
    
    // For Excel we warn them or suggest converting to CSV if we do server side CSV parsing
    setError('');
    setFile(selectedFile);
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    
    setLoading(true);
    setError('');
    
    try {
      // If it's an Excel file, we can convert it to CSV on the client side!
      // But since we built a robust CSV parser on the backend, if they upload a CSV, we upload directly.
      // If they upload Excel, we'll try to process it. To make this prototype fully functional and robust,
      // let's show an error if they try to upload .xlsx unless they export as .csv, or we can handle it.
      // Let's encourage CSV uploading, which is extremely robust.
      
      if (!file.name.endsWith('.csv')) {
        setError('Untuk saat ini, silakan ekspor file Excel Anda sebagai format CSV (.csv) lalu unggah kembali.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onUploadSuccess();
          handleClose();
        }, 1500);
      } else {
        setError(data.error || 'Gagal mengunggah file.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi saat mengunggah.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Unggah Data Penjualan</h2>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="var(--color-success)" />
            <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>Data Berhasil Diunggah!</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Dashboard sedang memperbarui data...</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div 
              className={`dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="file-input" 
                accept=".csv"
                onChange={handleChange}
              />
              <Upload className="dropzone-icon" size={36} style={{ color: file ? 'var(--color-primary)' : 'var(--text-secondary)' }} />
              {file ? (
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <FileText size={16} />
                    {file.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Tarik & lepas file CSV di sini</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Atau klik untuk menelusuri file komputer Anda (.csv)</p>
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', color: 'var(--color-danger)', fontSize: '0.85rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                Batal
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleUploadSubmit}
                disabled={!file || loading}
              >
                {loading ? 'Mengunggah...' : 'Proses Data'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
