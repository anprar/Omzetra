"use client";

import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Trash2, UserPlus, RefreshCw, CheckCircle2, User, ShoppingBag, Save, Edit2 } from 'lucide-react';

export default function AdminPanel({ isOpen, onClose, onResetSuccess }) {
  const [activeTab, setActiveTab] = useState('system'); // 'system', 'sales', 'products'
  
  // System tab states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  
  // List states
  const [salesList, setSalesList] = useState([]);
  const [productList, setProductList] = useState([]);
  
  // Inline edit states
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editVal, setEditVal] = useState(''); // target or price
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [confirmResetData, setConfirmResetData] = useState(false);
  const [confirmResetUsers, setConfirmResetUsers] = useState(false);

  // Fetch lists based on tab
  const fetchSalespeople = async () => {
    try {
      const res = await fetch('/api/admin/master/salespeople');
      if (res.ok) {
        const data = await res.json();
        setSalesList(data.list || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/master/products');
      if (res.ok) {
        const data = await res.json();
        setProductList(data.list || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'sales') {
        fetchSalespeople();
      } else if (activeTab === 'products') {
        fetchProducts();
      }
    }
  }, [isOpen, activeTab]);

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
      setError('Kesalahan koneksi');
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
        setSuccessMsg('Semua data penjualan telah direset.');
        setConfirmResetData(false);
        if (onResetSuccess) onResetSuccess();
      } else {
        setError('Gagal mereset data.');
      }
    } catch (err) {
      setError('Kesalahan koneksi');
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
        setSuccessMsg('Daftar user diset kembali ke default.');
        setConfirmResetUsers(false);
      } else {
        setError('Gagal mereset pengguna.');
      }
    } catch (err) {
      setError('Kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  // Start editing row
  const startEdit = (item, currentVal) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditVal(currentVal.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditVal('');
  };

  const saveSalesperson = async (id) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/master/salespeople', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName, target: editVal })
      });
      if (res.ok) {
        setSuccessMsg('Target sales berhasil diperbarui!');
        setEditingId(null);
        fetchSalespeople();
        if (onResetSuccess) onResetSuccess();
      } else {
        setError('Gagal memperbarui target sales.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  const saveProduct = async (id) => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/master/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName, price: editVal })
      });
      if (res.ok) {
        setSuccessMsg('Harga produk berhasil diperbarui!');
        setEditingId(null);
        fetchProducts();
        if (onResetSuccess) onResetSuccess();
      } else {
        setError('Gagal memperbarui harga produk.');
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: '650px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{ marginBottom: '1rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)' }}>
            <ShieldAlert size={24} />
            Admin Control Panel
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
          <button 
            onClick={() => { setActiveTab('system'); setError(''); setSuccessMsg(''); cancelEdit(); }}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'system' ? 'var(--color-primary-glow)' : 'transparent', color: activeTab === 'system' ? 'var(--color-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Sistem & User
          </button>
          <button 
            onClick={() => { setActiveTab('sales'); setError(''); setSuccessMsg(''); cancelEdit(); }}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'sales' ? 'var(--color-primary-glow)' : 'transparent', color: activeTab === 'sales' ? 'var(--color-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Kelola Target Sales
          </button>
          <button 
            onClick={() => { setActiveTab('products'); setError(''); setSuccessMsg(''); cancelEdit(); }}
            style={{ padding: '0.5rem 1rem', background: activeTab === 'products' ? 'var(--color-primary-glow)' : 'transparent', color: activeTab === 'products' ? 'var(--color-primary)' : 'var(--text-secondary)', border: 'none', borderRadius: 'var(--radius-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Kelola Harga Produk
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

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {/* TAB 1: System and User Settings */}
          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
          )}

          {/* TAB 2: Sales targets */}
          {activeTab === 'sales' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={18} style={{ color: 'var(--color-primary)' }} />
                Kelola Target Penjualan Sales
              </h3>
              
              {salesList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>Belum ada data sales. Silakan unggah file CSV data penjualan terlebih dahulu.</p>
              ) : (
                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>ID Sales</th>
                        <th>Nama Sales</th>
                        <th>Target Penjualan</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesList.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.id}</td>
                          <td>
                            {editingId === item.id ? (
                              <input 
                                type="text" 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)} 
                                style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', fontSize: '0.875rem', width: '140px' }}
                              />
                            ) : item.name}
                          </td>
                          <td>
                            {editingId === item.id ? (
                              <input 
                                type="number" 
                                value={editVal} 
                                onChange={(e) => setEditVal(e.target.value)} 
                                style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', fontSize: '0.875rem', width: '120px' }}
                              />
                            ) : (
                              new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.target)
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {editingId === item.id ? (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button className="close-btn" title="Simpan" onClick={() => saveSalesperson(item.id)} disabled={loading} style={{ color: 'var(--color-success)' }}>
                                  <Save size={16} />
                                </button>
                                <button className="close-btn" title="Batal" onClick={cancelEdit} disabled={loading}>
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button className="close-btn" title="Edit" onClick={() => startEdit(item, item.target)} style={{ margin: '0 auto' }}>
                                <Edit2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Product prices */}
          {activeTab === 'products' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingBag size={18} style={{ color: 'var(--color-secondary)' }} />
                Kelola Harga Produk (Master)
              </h3>
              
              {productList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>Belum ada data produk. Silakan unggah file CSV data penjualan terlebih dahulu.</p>
              ) : (
                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>ID Produk</th>
                        <th>Nama Produk</th>
                        <th>Harga Default</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productList.map((item) => (
                        <tr key={item.id}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.id}</td>
                          <td>
                            {editingId === item.id ? (
                              <input 
                                type="text" 
                                value={editName} 
                                onChange={(e) => setEditName(e.target.value)} 
                                style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', fontSize: '0.875rem', width: '180px' }}
                              />
                            ) : item.name}
                          </td>
                          <td>
                            {editingId === item.id ? (
                              <input 
                                type="number" 
                                value={editVal} 
                                onChange={(e) => setEditVal(e.target.value)} 
                                style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '4px', color: '#fff', fontSize: '0.875rem', width: '120px' }}
                              />
                            ) : (
                              new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.price)
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {editingId === item.id ? (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button className="close-btn" title="Simpan" onClick={() => saveProduct(item.id)} disabled={loading} style={{ color: 'var(--color-success)' }}>
                                  <Save size={16} />
                                </button>
                                <button className="close-btn" title="Batal" onClick={cancelEdit} disabled={loading}>
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <button className="close-btn" title="Edit" onClick={() => startEdit(item, item.price)} style={{ margin: '0 auto' }}>
                                <Edit2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
