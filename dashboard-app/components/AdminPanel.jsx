"use client";

import React, { useState } from 'react';
import { X, ShieldAlert, Trash2, UserPlus, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AdminPanel({ isOpen, onClose, onResetSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [confirmResetData, setConfirmResetData] = useState(false);
  const [confirmResetUsers, setConfirmResetUsers] = useState(false);

  if (!isOpen) return null;

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan Password wajib diisi');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      const res = await fetch('/api/admin/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        setSuccessMsg(`User "${username}" (${role}) berhasil ditambahkan!`);
        setUsername('');
        setPassword('');
        setRole('user');
      } else {
        setError(result.error || 'Gagal menambahkan user');
      }
    } catch (err) {
      setError('Kesalahan koneksi internet');
    } finally {
      setLoading(false);
    }
  };

  const handleResetData = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/reset-data', { method: 'POST' });
      if (res.ok) {
        setSuccessMsg('Semua data penjualan telah dihapus.');
        setConfirmResetData(false);
        if (onResetSuccess) onResetSuccess();
      } else {
        setError('Gagal menghapus data.');
      }
    } catch (err) {
      setError('Kesalahan koneksi internet');
    } finally {
      setLoading(false);
    }
  };

  const handleResetUsers = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/reset-users', { method: 'POST' });
      if (res.ok) {
        setSuccessMsg('Daftar pengguna telah direset ke default.');
        setConfirmResetUsers(false);
      } else {
        setError('Gagal mereset pengguna.');
      }
    } catch (err) {
      setError('Kesalahan koneksi internet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '550px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
            <ShieldAlert size={24} />
            Admin Control Panel
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Section 1: Add User */}
          <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={18} style={{ color: 'var(--color-secondary)' }} />
              Tambah Pengguna Baru
            </h3>
            <form onSubmit={handleAddUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ flex: 1, padding: '0.625rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                />
                <input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ flex: 1, padding: '0.625rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ padding: '0.625rem 1rem', background: '#0f172a', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="user">User (Regular)</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  Tambah User
                </button>
              </div>
            </form>
          </section>

          {/* Section 2: Manage Data (Reset) */}
          <section style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 size={18} style={{ color: 'var(--color-danger)' }} />
              Reset Data Penjualan
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Menghapus semua records penjualan dari database. Dashboard akan kembali kosong (*empty state*).
            </p>
            
            {confirmResetData ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmResetData(false)}>Batal</button>
                <button className="btn btn-primary" style={{ flex: 1, background: 'var(--color-danger)' }} onClick={handleResetData} disabled={loading}>
                  Ya, Hapus Semua Data
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" style={{ width: '100%', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--color-danger)' }} onClick={() => setConfirmResetData(true)}>
                Reset Semua Data Penjualan
              </button>
            )}
          </section>

          {/* Section 3: Reset Users to Default */}
          <section>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <RefreshCw size={18} style={{ color: 'var(--color-warning)' }} />
              Reset Daftar User ke Default
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Menghapus semua user tambahan dan mengembalikan user bawaan (`admin`/`adminomzetra` dan `user`/`12345`).
            </p>

            {confirmResetUsers ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmResetUsers(false)}>Batal</button>
                <button className="btn btn-primary" style={{ flex: 1, background: 'var(--color-warning)', color: '#000' }} onClick={handleResetUsers} disabled={loading}>
                  Ya, Reset Daftar User
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary" style={{ width: '100%', borderColor: 'rgba(245,158,11,0.2)', color: 'var(--color-warning)' }} onClick={() => setConfirmResetUsers(true)}>
                Reset Pengguna ke Default
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
