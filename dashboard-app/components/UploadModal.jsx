"use client";

import React, { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Link } from 'lucide-react';

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(Array.from(e.target.files));
    }
  };

  const validateAndAddFiles = (selectedFiles) => {
    const validFiles = [];
    let hasUnsupported = false;
    
    for (const selectedFile of selectedFiles) {
      const isCsv = selectedFile.name.toLowerCase().endsWith('.csv');
      const isExcel = selectedFile.name.toLowerCase().endsWith('.xlsx') || selectedFile.name.toLowerCase().endsWith('.xls');
      
      if (!isCsv && !isExcel) {
        hasUnsupported = true;
      } else {
        // Prevent duplicate file entries
        if (!files.some(f => f.name === selectedFile.name && f.size === selectedFile.size)) {
          validFiles.push(selectedFile);
        }
      }
    }
    
    if (hasUnsupported) {
      setError('Beberapa file dilewati karena format tidak didukung (gunakan .csv, .xlsx, atau .xls)');
    } else {
      setError('');
    }
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setSheetUrl(''); // Clear link input if files are chosen
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUploadSubmit = async () => {
    if (files.length === 0 && !sheetUrl.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      if (files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
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
    setFiles([]);
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* OPTION 1: File Upload */}
            <div 
              className={`dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              style={{ border: files.length > 0 ? '2px dashed var(--color-primary)' : '2px dashed rgba(255,255,255,0.15)', cursor: 'pointer', padding: '1.5rem 1rem' }}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="file-input" 
                accept=".csv,.xlsx,.xls"
                multiple
                onChange={handleChange}
              />
              <Upload className="dropzone-icon" size={28} style={{ color: files.length > 0 ? 'var(--color-primary)' : 'var(--text-secondary)' }} />
              <div>
                <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Pilih atau seret berkas di sini</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>Mendukung beberapa file sekaligus format CSV (.csv) atau Excel (.xlsx, .xls)</p>
              </div>
            </div>

            {/* List of selected files */}
            {files.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>File terpilih ({files.length}):</p>
                {files.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                      <FileText size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>{f.name}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({(f.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.25rem' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

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
                  setFiles([]); // Clear files if URL is typed
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
                disabled={(files.length === 0 && !sheetUrl.trim()) || loading}
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
