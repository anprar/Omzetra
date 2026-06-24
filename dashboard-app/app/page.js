"use client";

import React, { useState, useEffect } from 'react';
import { Upload, RefreshCw, BarChart3, Users, Award, Sparkles, FileSpreadsheet, ShoppingBag, Settings, LogOut } from 'lucide-react';
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

  // Login Form States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const session = sessionStorage.getItem('omzetra_session');
    if (session) {
      setCurrentUser(JSON.parse(session));
      fetchDashboardData();
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
        // Fetch dashboard data immediately after login
        await fetchDashboardData();
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

  const hasData = data && data.metrics && data.metrics.totalOmzet > 0;

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
            <h1>Omzetra Dashboard</h1>
            <p>Sistem Analisis Penjualan Harian dan Insight Otomatis</p>
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
              Dashboard masih kosong. Unggah laporan penjualan harian dalam format CSV atau Excel untuk memulai visualisasi metrik bisnis Anda secara instan.
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
          {/* KPI Row */}
          <KPIGrid metrics={data.metrics} />

          {/* Automated Insights */}
          <AutomatedInsights insights={data.insights} />

          {/* Charts & Graphs Row */}
          <div className="widgets-grid">
            <div className="glass-card">
              <h3 className="widget-title">
                <BarChart3 size={18} style={{ color: 'var(--color-primary)' }} />
                Tren Omzet Penjualan Harian
              </h3>
              <TrendChart trendData={data.salesTrend} />
            </div>

            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.1)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ color: 'var(--color-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Customer Aktif</h4>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{data.topCustomers.length} Customer</p>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Produk Terjual</h4>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                    {data.topProducts.reduce((acc, p) => acc + p.total_qty, 0)} Pcs
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Rankings & Tables Grid */}
          <div className="widgets-grid">
            <TopList 
              title="Top Customer (Omzet Terbesar)" 
              icon={Users} 
              data={data.topCustomers} 
              type="customer" 
            />
            <TopList 
              title="Top Produk (Omzet Terbesar)" 
              icon={ShoppingBag} 
              data={data.topProducts} 
              type="product" 
            />
          </div>

          <SalesPerformanceTable data={data.salesPerformance} />
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
