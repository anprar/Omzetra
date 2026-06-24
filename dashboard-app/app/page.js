"use client";

import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  RefreshCw, 
  BarChart3, 
  Users, 
  Award, 
  Sparkles, 
  FileSpreadsheet, 
  ShoppingBag, 
  Settings, 
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Layers,
  ArrowRight,
  Filter,
  Info
} from 'lucide-react';
import UploadModal from '@/components/UploadModal';
import AdminPanel from '@/components/AdminPanel';
import { 
  KPIGrid, 
  TrendChart, 
  TopList, 
  SalesPerformanceTable, 
  AutomatedInsights 
} from '@/components/DashboardWidgets';

export default function Dashboard() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Global Filter States
  const [periodType, setPeriodType] = useState('all'); // 'all' | 'this-month' | '30-days' | 'this-quarter' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterSalesId, setFilterSalesId] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [filterProductId, setFilterProductId] = useState('');
  const [dbDateRange, setDbDateRange] = useState({ minDate: '', maxDate: '' });

  // Interactive System Workflow Tab State
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('flow'); // 'flow' | 'risks' | 'arch'

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Transaction Table States
  const [transactions, setTransactions] = useState([]);
  const [txSearch, setTxSearch] = useState('');
  const [txSortBy, setTxSortBy] = useState('tanggal');
  const [txOrder, setTxOrder] = useState('DESC');
  const [txPage, setTxPage] = useState(1);
  const [txPagination, setTxPagination] = useState({ totalCount: 0, totalPages: 1 });

  // Update dates based on period selection
  useEffect(() => {
    // Determine the anchor date (default to today, or use the maxDate from the database if available)
    let anchor = new Date();
    if (dbDateRange && dbDateRange.maxDate) {
      anchor = new Date(dbDateRange.maxDate);
    }

    if (periodType === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (periodType === 'this-month') {
      const firstDay = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const lastDay = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (periodType === '30-days') {
      const past = new Date(anchor);
      past.setDate(anchor.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(anchor.toISOString().split('T')[0]);
    } else if (periodType === 'this-quarter') {
      const quarter = Math.floor(anchor.getMonth() / 3);
      const firstDay = new Date(anchor.getFullYear(), quarter * 3, 1);
      const lastDay = new Date(anchor.getFullYear(), (quarter + 1) * 3, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  }, [periodType, dbDateRange]);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      // Build query string with active filters
      let queryParams = [];
      if (startDate) queryParams.push(`startDate=${startDate}`);
      if (endDate) queryParams.push(`endDate=${endDate}`);
      if (filterSalesId) queryParams.push(`salesId=${filterSalesId}`);
      if (filterCustomerId) queryParams.push(`customerId=${filterCustomerId}`);
      if (filterProductId) queryParams.push(`productId=${filterProductId}`);

      const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
      const res = await fetch(`/api/dashboard${queryString}`);
      
      if (res.ok) {
        const result = await res.json();
        setData(result);
        if (result.dateRange && result.dateRange.maxDate) {
          setDbDateRange(result.dateRange);
        }
      }
      // Also fetch transaction list
      await fetchTransactions();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      let queryParams = [
        `search=${encodeURIComponent(txSearch)}`,
        `sortBy=${txSortBy}`,
        `order=${txOrder}`,
        `page=${txPage}`,
        `limit=10`
      ];
      if (startDate) queryParams.push(`startDate=${startDate}`);
      if (endDate) queryParams.push(`endDate=${endDate}`);
      if (filterSalesId) queryParams.push(`salesId=${filterSalesId}`);
      if (filterCustomerId) queryParams.push(`customerId=${filterCustomerId}`);
      if (filterProductId) queryParams.push(`productId=${filterProductId}`);

      const queryString = '?' + queryParams.join('&');
      const res = await fetch(`/api/transactions${queryString}`);
      if (res.ok) {
        const result = await res.json();
        setTransactions(result.transactions || []);
        setTxPagination(result.pagination || { totalCount: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  // Trigger data fetch when filters change
  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [startDate, endDate, filterSalesId, filterCustomerId, filterProductId, currentUser]);

  // Trigger search/sort fetch
  useEffect(() => {
    if (currentUser) {
      fetchTransactions();
    }
  }, [txSearch, txSortBy, txOrder, txPage]);

  useEffect(() => {
    const session = sessionStorage.getItem('omzetra_session');
    if (session) {
      setCurrentUser(JSON.parse(session));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) {
      setLoginError('Username dan Password wajib diisi');
      return;
    }
    
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      
      const result = await res.json();
      
      if (res.ok && result.success) {
        setCurrentUser(result.user);
        sessionStorage.setItem('omzetra_session', JSON.stringify(result.user));
        setLoading(true);
      } else {
        setLoginError(result.error || 'Username atau Password salah');
      }
    } catch (err) {
      setLoginError('Terjadi kesalahan koneksi internet');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('omzetra_session');
    setCurrentUser(null);
    setData(null);
    setTransactions([]);
  };

  const handleSort = (field) => {
    if (txSortBy === field) {
      setTxOrder(txOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setTxSortBy(field);
      setTxOrder('DESC');
    }
    setTxPage(1);
  };

  const renderSortableHeader = (field, label) => {
    const isActive = txSortBy === field;
    return (
      <th 
        onClick={() => handleSort(field)}
        style={{ cursor: 'pointer', userSelect: 'none', transition: 'color 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={(e) => e.currentTarget.style.color = ''}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {label}
          <ArrowUpDown size={12} style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-muted)', opacity: isActive ? 1 : 0.4 }} />
        </div>
      </th>
    );
  };

  // Render Login Page if user is not authenticated
  if (!currentUser && !loading) {
    return (
      <main className="dashboard-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
        <div className="ambient-glow-1"></div>
        <div className="ambient-glow-2"></div>
        
        <div className="glass-card" style={{ width: '400px', maxWidth: '100%', padding: '2.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: 'var(--shadow-lg), var(--shadow-neon)', textAlign: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.6))', marginBottom: '0.5rem' }}>
              <defs>
                <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-secondary)" />
                </linearGradient>
              </defs>
              <circle cx="16" cy="16" r="11" stroke="url(#logoGrad2)" strokeWidth="3" strokeLinecap="round" strokeDasharray="50 16" />
              <path d="M11 20L15 16L18 19L22 13" stroke="url(#logoGrad2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 13H22V17" stroke="url(#logoGrad2)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700 }}>Omzetra Sign In</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Masukkan akun untuk mengakses sales dashboard</p>
          </div>

          {loginError && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: '0.85rem', textAlign: 'left' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Username</label>
              <input 
                type="text" 
                placeholder="Masukkan username" 
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Password</label>
              <input 
                type="password" 
                placeholder="Masukkan password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                style={{ padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginTop: '0.5rem' }} disabled={loginLoading}>
              {loginLoading ? 'Memproses...' : 'Sign In'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const hasData = data && data.metrics && (data.metrics.totalOmzet > 0 || data.metrics.totalTransactions > 0);

  // Prepare product lists separated by Omzet and Quantity
  const productsByOmzet = data?.topProducts || [];
  const productsByQty = data?.topProducts ? [...data.topProducts].sort((a, b) => b.total_qty - a.total_qty) : [];

  return (
    <main className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))' }}>
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="var(--color-secondary)" />
              </linearGradient>
            </defs>
            <circle cx="16" cy="16" r="11" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="50 16" />
            <path d="M11 20L15 16L18 19L22 13" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 13H22V17" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Omzetra Dashboard 
              <span style={{ background: 'var(--color-primary-glow)', border: '1px solid var(--color-primary)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Activation Hub</span>
            </h1>
            <p>Sistem Analisis Penjualan Strategis, Deteksi Anomali, dan Validasi Data Terpadu</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {currentUser?.role === 'admin' && (
            <button 
              className="btn btn-secondary" 
              onClick={() => setIsAdminOpen(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', padding: 0 }}
              title="Admin Control Panel"
            >
              <Settings size={18} />
            </button>
          )}
          {hasData && (
            <button 
              className="btn btn-secondary" 
              onClick={fetchDashboardData}
              disabled={refreshing}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', padding: 0 }}
              title="Refresh Data"
            >
              <RefreshCw size={18} className={refreshing ? 'loading' : ''} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)}>
            <Upload size={16} />
            Unggah Excel/CSV
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', padding: 0 }}
            title="Keluar / Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* GLOBAL FILTER BAR */}
      {hasData && (
        <div className="filter-bar-container">
          <div className="filter-title-group">
            <Filter size={16} style={{ color: 'var(--color-primary)' }} />
            <span>FILTER ANALISIS</span>
          </div>

          <div className="filter-separator"></div>

          {/* Period Type Selection */}
          <div className="filter-group">
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PERIODE</label>
            <select 
              value={periodType} 
              onChange={(e) => setPeriodType(e.target.value)}
              className="filter-select"
            >
              <option value="all">Semua Waktu</option>
              <option value="this-month">Bulan Ini</option>
              <option value="30-days">30 Hari Terakhir</option>
              <option value="this-quarter">Kuartal Ini</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Dates Inputs */}
          {periodType === 'custom' && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="filter-group">
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>DARI TANGGAL</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="filter-select"
                />
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px' }}>s/d</span>
              <div className="filter-group">
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>SAMPAI TANGGAL</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="filter-select"
                />
              </div>
            </div>
          )}

          {/* Salesperson Filter */}
          <div className="filter-group">
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>SALESPERSON</label>
            <select 
              value={filterSalesId} 
              onChange={(e) => setFilterSalesId(e.target.value)}
              className="filter-select"
              style={{ minWidth: '130px' }}
            >
              <option value="">Semua Sales</option>
              {data?.salesPerformance?.map(s => (
                <option key={s.sales_id} value={s.sales_id}>{s.sales}</option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div className="filter-group">
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PELANGGAN</label>
            <select 
              value={filterCustomerId} 
              onChange={(e) => setFilterCustomerId(e.target.value)}
              className="filter-select"
              style={{ minWidth: '145px' }}
            >
              <option value="">Semua Pelanggan</option>
              {data?.topCustomers?.map(c => (
                <option key={c.customer_id} value={c.customer_id}>{c.customer}</option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="filter-group">
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>PRODUK</label>
            <select 
              value={filterProductId} 
              onChange={(e) => setFilterProductId(e.target.value)}
              className="filter-select"
              style={{ minWidth: '150px' }}
            >
              <option value="">Semua Produk</option>
              {data?.topProducts?.map(p => (
                <option key={p.product_id} value={p.product_id}>{p.produk}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {(periodType !== 'all' || filterSalesId || filterCustomerId || filterProductId) && (
            <button 
              className="btn btn-secondary"
              onClick={() => {
                setPeriodType('all');
                setStartDate('');
                setEndDate('');
                setFilterSalesId('');
                setFilterCustomerId('');
                setFilterProductId('');
              }}
              style={{ padding: '0.4rem 0.75rem', height: 'auto', fontSize: '0.75rem', marginTop: '12px', marginLeft: 'auto' }}
            >
              Reset Filter
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem 0' }}>
          <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }}></div>
          <div className="widgets-grid">
            <div className="skeleton" style={{ height: '350px', borderRadius: 'var(--radius-lg)' }}></div>
            <div className="skeleton" style={{ height: '350px', borderRadius: 'var(--radius-lg)' }}></div>
          </div>
        </div>
      ) : !hasData ? (
        // Empty State
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '60vh', 
          textAlign: 'center',
          gap: '1.5rem' 
        }}>
          <div style={{ 
            background: 'var(--color-primary-glow)', 
            padding: '2rem', 
            borderRadius: '50%', 
            color: 'var(--color-primary)',
            boxShadow: 'var(--shadow-neon)' 
          }}>
            <FileSpreadsheet size={64} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Belum Ada Data Penjualan
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Dashboard masih kosong. Unggah laporan penjualan bulanan (format CSV, Excel, atau Tautan Google Sheets) untuk memulai visualisasi instan.
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsUploadOpen(true)} style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
            <Upload size={18} />
            Mulai Unggah File
          </button>
        </div>
      ) : (
        // Dashboard Content
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* KPI Row (Now with Growth Rates) */}
          <KPIGrid metrics={data.metrics} growthMetrics={data.growthMetrics} />

          {/* DATA INTEGRITY & UPLOAD VALIDATION PANEL */}
          {data?.lastUploadValidation && (
            <div className="glass-card" style={{ border: '1px solid rgba(16, 185, 129, 0.2)', background: 'rgba(16, 185, 129, 0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                <h3 className="widget-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                  <ShieldCheck size={18} style={{ color: 'var(--color-success)' }} />
                  Panel Validasi & Integritas Data (Last Upload Status)
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Diunggah pada: {new Date(data.lastUploadValidation.timestamp).toLocaleString('id-ID')}
                </span>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Baris Terbaca</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    {data.lastUploadValidation.totalRows} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>baris</span>
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>Transaksi Valid (Imported)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '0.25rem' }}>
                    {data.lastUploadValidation.validRows} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>sukses</span>
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 600 }}>Duplikat Diabaikan</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-warning)', marginTop: '0.25rem' }}>
                    {data.lastUploadValidation.duplicateCount} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>diabaikan</span>
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 600 }}>Data Kosong / Cacat</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-danger)', marginTop: '0.25rem' }}>
                    {data.lastUploadValidation.emptyCells + data.lastUploadValidation.invalidDates} <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>baris</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem', background: 'rgba(255,255,255,0.01)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <CheckCircle size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                <span>
                  <b>Pemeriksaan Kolom Wajib:</b> Tanggal ({data.lastUploadValidation.headersStatus?.tanggal ? '✓ Tersedia' : '✗ Hilang'}), Pelanggan ({data.lastUploadValidation.headersStatus?.customer ? '✓ Tersedia' : '✗ Hilang'}), Produk ({data.lastUploadValidation.headersStatus?.produk ? '✓ Tersedia' : '✗ Hilang'}), Sales ({data.lastUploadValidation.headersStatus?.sales ? '✓ Tersedia' : '✗ Hilang'}), Qty ({data.lastUploadValidation.headersStatus?.qty ? '✓ Tersedia' : '✗ Hilang'}), Harga ({data.lastUploadValidation.headersStatus?.harga ? '✓ Tersedia' : '✗ Hilang'}).
                </span>
              </div>
            </div>
          )}

          {/* Automated Insights with Strategic Business Advice */}
          <AutomatedInsights insights={data.insights} />

          {/* Charts & Graphs Row (Dynamic Multidimensional Chart) */}
          <div className="widgets-grid">
            <div className="glass-card">
              <h3 className="widget-title">
                <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
                Grafik Analisis Penjualan Omzetra
              </h3>
              <TrendChart 
                trendData={data.salesTrend} 
                productsData={productsByOmzet}
                salesData={data.salesPerformance}
                customersData={data.topCustomers}
              />
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.03)', border: '1px solid rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Customer Aktif</h4>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{data.topCustomers.length} Customer</p>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.03)', border: '1px solid rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Jenis Produk Terjual</h4>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{data.topProducts.length} Varian Produk</p>
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE SYSTEM ARCHITECTURE WORKFLOW & TECH-STACK HUB (FOR CASE STUDY PRESENTATION) */}
          <div className="glass-card" style={{ border: '1px solid rgba(139, 92, 246, 0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 className="widget-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={18} style={{ color: 'var(--color-primary)' }} />
                AI Activation Specialist: Rancangan Solusi & Manajemen Risiko
              </h3>

              <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
                <button 
                  onClick={() => setActiveWorkflowTab('flow')} 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: activeWorkflowTab === 'flow' ? 'var(--color-primary)' : 'transparent', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Alur Kerja Sistem
                </button>
                <button 
                  onClick={() => setActiveWorkflowTab('risks')} 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: activeWorkflowTab === 'risks' ? 'var(--color-primary)' : 'transparent', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Analisis Risiko & Mitigasi
                </button>
                <button 
                  onClick={() => setActiveWorkflowTab('arch')} 
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', background: activeWorkflowTab === 'arch' ? 'var(--color-primary)' : 'transparent', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Pendekatan Teknologi
                </button>
              </div>
            </div>

            {activeWorkflowTab === 'flow' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Berikut adalah rancangan alur kerja otomatis dari input file penjualan berantakan hingga penayangan rekomendasi keputusan bisnis strategis bagi manajemen:
                </p>
                
                {/* Visual workflow nodes */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                  {[
                    { step: '1', title: 'Upload File', desc: 'File Excel/CSV / Google Sheets', icon: FileSpreadsheet, color: 'rgba(6, 182, 212, 0.15)' },
                    { step: '2', title: 'Validation Engine', desc: 'Auto-checks & deduplication', icon: ShieldCheck, color: 'rgba(16, 185, 129, 0.15)' },
                    { step: '3', title: 'Relational Warehouse', desc: 'Normal 3NF SQL storage', icon: FileCode, color: 'rgba(139, 92, 246, 0.15)' },
                    { step: '4', title: 'Growth Comparator', desc: 'Period-over-period statistics', icon: BarChart3, color: 'rgba(245, 158, 11, 0.15)' },
                    { step: '5', title: 'AI Recommendation', desc: 'Temuan ➔ Dampak ➔ Solusi', icon: Sparkles, color: 'var(--color-primary-glow)' }
                  ].map((nd, idx) => (
                    <React.Fragment key={nd.step}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '160px', padding: '1rem', background: nd.color, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', textAlign: 'center', position: 'relative' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#fff', marginBottom: '0.5rem' }}>{nd.step}</div>
                        <nd.icon size={20} style={{ color: '#fff', marginBottom: '0.5rem' }} />
                        <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#fff', marginBottom: '0.25rem' }}>{nd.title}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>{nd.desc}</div>
                      </div>
                      {idx < 4 && <ArrowRight size={18} style={{ color: 'var(--text-muted)', margin: '0 0.25rem' }} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {activeWorkflowTab === 'risks' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    <span>Risiko 1: Format Data Tidak Konsisten</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <b>Dampak:</b> Kesalahan kalkulasi KPI dan anjloknya performa database saat parsing cell kosong atau format tanggal acak.<br/>
                    <b>Mitigasi:</b> Implementasi auto-slugification pada ID master data, pembersihan karakter (*trim casing*), sensor data cacat pra-simpan, serta panel validasi log unggah yang informatif.
                  </p>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-warning)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    <span>Risiko 2: Target Quota Bias</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <b>Dampak:</b> Target kuota penjualan statis dari file CSV cenderung terlampaui secara drastis (bias performa) sehingga evaluasi bonus terganggu.<br/>
                    <b>Mitigasi:</b> Menyediakan portal penyuntingan target dinamis eksklusif Admin Panel untuk mengkalibrasi besaran target sesuai kondisi riil pasar.
                  </p>
                </div>

                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-secondary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    <AlertTriangle size={16} />
                    <span>Risiko 3: Skalabilitas Penyimpanan</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    <b>Dampak:</b> Kueri analisis harian melambat seiring bertambahnya volume data dari ribuan baris menjadi jutaan transaksi.<br/>
                    <b>Mitigasi:</b> Pengindeksan terpadu (*composite indexes*) pada kolom relasional kunci (`tanggal`, `sales_id`, etc.) serta struktur arsitektur SQL yang kompatibel untuk migrasi tanpa hambatan ke PostgreSQL.
                  </p>
                </div>
              </div>
            )}

            {activeWorkflowTab === 'arch' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Pendekatan teknologi dashboard dirancang secara efisien menggunakan tumpukan teknologi modern untuk skalabilitas tinggi:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <b>Frontend & Core Framework:</b> Next.js dengan server-rendered API dynamic routing untuk pengolahan kueri SQL di sisi server secara aman.
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <b>Datastore & Relational Warehouse:</b> SQLite local database menggunakan normalisasi relasional bentuk ketiga (3NF) untuk integritas referensi data master.
                  </div>
                  <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <b>Data Parsing Engine:</b> library JS xlsx (SheetJS) terintegrasi pada backend serverless route untuk konversi instan berkas biner `.xlsx` menjadi baris JSON.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Rankings Grid (Split Top Products by Revenue vs Volume) */}
          <div className="widgets-grid">
            <TopList 
              title="Top Customer (Omzet Terbesar)" 
              icon={Users} 
              data={data.topCustomers} 
              type="customer" 
            />
            
            {/* Split Product Cards: Omzet vs Volume */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <TopList 
                title="Top Produk Berdasarkan Omzet (Revenue)" 
                icon={ShoppingBag} 
                data={productsByOmzet} 
                type="product" 
              />
              <TopList 
                title="Top Produk Berdasarkan Kuantitas (Volume)" 
                icon={ShoppingBag} 
                data={productsByQty} 
                type="product" 
              />
            </div>
          </div>

          {/* Sales Performance table */}
          <SalesPerformanceTable data={data.salesPerformance} />

          {/* Widget: Transaction History Table */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="tx-header">
              <h3 className="widget-title" style={{ marginBottom: 0 }}>
                <FileSpreadsheet size={18} style={{ color: 'var(--color-primary)' }} />
                Histori Transaksi Penjualan (Isi CSV/Excel)
              </h3>
              
              {/* Search Bar */}
              <div className="search-container">
                <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Cari pelanggan, produk, sales..." 
                  value={txSearch}
                  onChange={(e) => { setTxSearch(e.target.value); setTxPage(1); }}
                  style={{ padding: '0.5rem 1rem 0.5rem 2.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', outline: 'none', fontSize: '0.85rem', width: '260px' }}
                />
              </div>
            </div>

            {transactions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '3rem 0' }}>
                Tidak ada transaksi ditemukan pada periode terpilih.
              </p>
            ) : (
              <>
                <div className="custom-table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        {renderSortableHeader('tanggal', 'Tanggal')}
                        {renderSortableHeader('customer', 'Pelanggan')}
                        {renderSortableHeader('produk', 'Produk')}
                        {renderSortableHeader('sales', 'Sales')}
                        {renderSortableHeader('qty', 'Qty')}
                        {renderSortableHeader('harga', 'Harga')}
                        {renderSortableHeader('omzet', 'Omzet')}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.tanggal}</td>
                          <td style={{ fontWeight: 600 }}>{tx.customer}</td>
                          <td>{tx.produk}</td>
                          <td>{tx.sales}</td>
                          <td>{tx.qty}</td>
                          <td>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.harga)}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.omzet)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>
                    Menampilkan <b>{transactions.length}</b> dari <b>{txPagination.totalCount}</b> transaksi
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      disabled={txPage === 1}
                      onClick={() => setTxPage(p => Math.max(p - 1, 1))}
                      style={{ padding: '0.35rem 0.75rem', height: 'auto', display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>Halaman <b>{txPage}</b> dari <b>{txPagination.totalPages || 1}</b></span>
                    <button 
                      className="btn btn-secondary" 
                      disabled={txPage >= txPagination.totalPages}
                      onClick={() => setTxPage(p => Math.min(p + 1, txPagination.totalPages))}
                      style={{ padding: '0.35rem 0.75rem', height: 'auto', display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={fetchDashboardData} 
      />

      <AdminPanel 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        onResetSuccess={fetchDashboardData} 
      />

      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <span>&copy; {new Date().getFullYear()} Omzetra. All rights reserved.</span>
        <span>Premium Dashboard Interface</span>
      </footer>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
