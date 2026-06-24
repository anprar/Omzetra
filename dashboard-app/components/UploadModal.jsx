"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Link } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [sheetUrl, setSheetUrl] = useState('');
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
    const isCsv = selectedFile.name.toLowerCase().endsWith('.csv');
    const isExcel = selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls');
    
    if (!isCsv && !isExcel) {
      setError('Format file tidak didukung. Silakan gunakan .csv, .xlsx, atau .xls');
      setFile(null);
      return;
    }
    
    setError('');
    setFile(selectedFile);
    setSheetUrl(''); // Clear link input if file is chosen
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUploadSubmit = async () => {
    if (!file && !sheetUrl.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('sheetUrl', sheetUrl.trim());
      }
      
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
        setError(data.error || 'Gagal memproses data.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi saat mengunggah.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setSheetUrl('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ width: '520px' }} onClick={(e) => e.stopPropagation()}>
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
            
            {/* OPTION 1: File Upload */}
            <div 
              className={`dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              style={{ border: file ? '2px dashed var(--color-primary)' : '2px dashed rgba(255,255,255,0.15)' }}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="file-input" 
                accept=".csv,.xlsx,.xls"
                onChange={handleChange}
              />
              <Upload className="dropzone-icon" size={32} style={{ color: file ? 'var(--color-primary)' : 'var(--text-secondary)' }} />
              {file ? (
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                    <FileText size={16} />
                    {file.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Pilih atau seret berkas di sini</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>Mendukung format CSV (.csv) atau Excel (.xlsx, .xls)</p>
                </div>
              )}
            </div>

            {/* Separator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>atau</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            </div>

            {/* OPTION 2: Google Sheets URL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Link size={14} />
                Link Google Sheets Publik
              </label>
              <input 
                type="text" 
                placeholder="Tempel link Google Sheet (Anyone with the link can view)" 
                value={sheetUrl}
                onChange={(e) => {
                  setSheetUrl(e.target.value);
                  setFile(null); // Clear file if URL is typed
                }}
                style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }}
              />
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
                disabled={(!file && !sheetUrl.trim()) || loading}
              >
                {loading ? 'Mengimpor...' : 'Proses Data'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
