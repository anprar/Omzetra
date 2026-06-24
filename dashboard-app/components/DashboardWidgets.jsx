"use client";

import React from 'react';
import { 
  TrendingUp, 
  Target, 
  Users, 
  ShoppingBag, 
  Award, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react';

// Format helper
const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(val);
};

export function KPIGrid({ metrics }) {
  const { totalOmzet, totalTarget, achievementPercent } = metrics;
  
  return (
    <div className="kpi-grid">
      <div className="glass-card kpi-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="kpi-title">Total Omzet</div>
            <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>
              {formatRupiah(totalOmzet)}
            </div>
          </div>
          <div style={{ padding: '8px', background: 'var(--color-primary-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--color-primary)' }}>
            <TrendingUp size={20} />
          </div>
        </div>
        <div className="kpi-meta">
          <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
            <ArrowUpRight size={14} /> Pencapaian
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>dari total target</span>
        </div>
      </div>

      <div className="glass-card kpi-card" style={{ '--color-primary': 'var(--color-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="kpi-title">Target Penjualan</div>
            <div className="kpi-value" style={{ color: 'var(--text-primary)' }}>
              {formatRupiah(totalTarget)}
            </div>
          </div>
          <div style={{ padding: '8px', background: 'var(--color-secondary-glow)', borderRadius: 'var(--radius-sm)', color: 'var(--color-secondary)' }}>
            <Target size={20} />
          </div>
        </div>
        <div className="kpi-meta" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Progress Target</span>
            <span style={{ fontWeight: 600, color: achievementPercent >= 100 ? 'var(--color-success)' : 'var(--color-secondary)' }}>
              {achievementPercent.toFixed(1)}%
            </span>
          </div>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ 
                width: `${Math.min(achievementPercent, 100)}%`,
                background: achievementPercent >= 100 
                  ? 'linear-gradient(90deg, var(--color-success) 0%, #34d399 100%)' 
                  : 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrendChart({ trendData }) {
  if (!trendData || trendData.length === 0) {
    return (
      <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        Belum ada data untuk menampilkan grafik trend.
      </div>
    );
  }

  const chartHeight = 150;
  const chartWidth = 500;
  const paddingX = 40;
  const paddingY = 20;

  const maxVal = Math.max(...trendData.map(d => Math.max(d.total_omzet, d.total_target || 0))) || 1;

  // Generate coordinates for Omzet line
  const omzetPoints = trendData.map((d, index) => {
    const x = paddingX + (index * (chartWidth - paddingX * 2) / (trendData.length - 1 || 1));
    const y = chartHeight - paddingY - (d.total_omzet * (chartHeight - paddingY * 2) / maxVal);
    return { x, y };
  });

  const omzetPath = omzetPoints.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, '');
  const omzetArea = omzetPoints.length > 0 
    ? `${omzetPath} L ${omzetPoints[omzetPoints.length - 1].x} ${chartHeight - paddingY} L ${omzetPoints[0].x} ${chartHeight - paddingY} Z`
    : '';

  return (
    <div style={{ width: '100%', marginTop: '1rem' }}>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="omzetGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0"/>
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.03)" />
        <line x1={paddingX} y1={(chartHeight - paddingY * 2) / 2 + paddingY} x2={chartWidth - paddingX} y2={(chartHeight - paddingY * 2) / 2 + paddingY} stroke="rgba(255,255,255,0.03)" />
        <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="rgba(255,255,255,0.08)" />

        {/* Area fill */}
        {omzetArea && <path d={omzetArea} fill="url(#omzetGrad)" />}

        {/* Trend line */}
        {omzetPath && (
          <path 
            d={omzetPath} 
            fill="none" 
            stroke="var(--color-primary)" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        )}

        {/* Data points */}
        {omzetPoints.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#030712" stroke="var(--color-primary)" strokeWidth="2" />
            {/* Tooltip hover effect (simplified) */}
            <title>{`${trendData[i].tanggal}: ${formatRupiah(trendData[i].total_omzet)}`}</title>
          </g>
        ))}

        {/* X-Axis labels */}
        {trendData.map((d, i) => {
          if (trendData.length > 7 && i % Math.ceil(trendData.length / 5) !== 0) return null;
          const x = paddingX + (i * (chartWidth - paddingX * 2) / (trendData.length - 1 || 1));
          return (
            <text 
              key={i} 
              x={x} 
              y={chartHeight - 4} 
              textAnchor="middle" 
              fill="var(--text-muted)" 
              fontSize="8"
              fontFamily="var(--font-body)"
            >
              {d.tanggal}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function TopList({ title, icon: Icon, data, type }) {
  return (
    <div className="glass-card" style={{ height: '100%' }}>
      <h3 className="widget-title">
        <Icon size={18} style={{ color: 'var(--color-secondary)' }} />
        {title}
      </h3>
      {(!data || data.length === 0) ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
          Belum ada data.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {data.map((item, index) => {
            const name = type === 'customer' ? item.customer : item.produk;
            const extra = type === 'product' ? `${item.total_qty} Qty` : '';
            const value = item.total_omzet;

            return (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '0.75rem 1rem', 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    background: index === 0 ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: index === 0 ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{name}</div>
                    {extra && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{extra}</div>}
                  </div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {formatRupiah(value)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SalesPerformanceTable({ data }) {
  return (
    <div className="glass-card">
      <h3 className="widget-title">
        <Award size={18} style={{ color: 'var(--color-primary)' }} />
        Performa Sales
      </h3>
      
      {(!data || data.length === 0) ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
          Belum ada data sales.
        </p>
      ) : (
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Sales</th>
                <th>Total Omzet</th>
                <th>Target</th>
                <th>Pencapaian</th>
                <th style={{ width: '150px' }}>Progress</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => {
                const achPercent = item.total_target > 0 ? (item.total_omzet / item.total_target) * 100 : 0;
                
                return (
                  <tr key={index}>
                    <td style={{ fontWeight: 600 }}>{item.sales}</td>
                    <td>{formatRupiah(item.total_omzet)}</td>
                    <td>{formatRupiah(item.total_target)}</td>
                    <td style={{ 
                      fontWeight: 600, 
                      color: achPercent >= 100 ? 'var(--color-success)' : achPercent >= 75 ? 'var(--color-warning)' : 'var(--color-danger)'
                    }}>
                      {achPercent.toFixed(1)}%
                    </td>
                    <td>
                      <div className="progress-container" style={{ margin: 0, height: '4px' }}>
                        <div 
                          className="progress-bar" 
                          style={{ 
                            width: `${Math.min(achPercent, 100)}%`,
                            background: achPercent >= 100 ? 'var(--color-success)' : 'var(--color-primary)'
                          }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AutomatedInsights({ insights }) {
  return (
    <div className="glass-card">
      <h3 className="widget-title">
        <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
        Insight Otomatis
      </h3>
      
      <div className="insight-box">
        {insights.map((insight, index) => (
          <div key={index} className="insight-item">
            <Sparkles size={14} className="insight-icon" />
            <span dangerouslySetInnerHTML={{ __html: insight }} />
          </div>
        ))}
      </div>
    </div>
  );
}
