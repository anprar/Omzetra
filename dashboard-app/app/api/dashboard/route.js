import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // 1. Basic metrics (Total Omzet, Total Target)
    const metricsResult = await query(
      `SELECT 
        (SELECT SUM(omzet) FROM sales) as total_omzet, 
        (SELECT SUM(target) FROM salespeople) as total_target`
    );
    const totalOmzet = metricsResult[0]?.total_omzet || 0;
    const totalTarget = metricsResult[0]?.total_target || 0;
    const achievementPercent = totalTarget > 0 ? (totalOmzet / totalTarget) * 100 : 0;

    // 2. Top Customers
    const topCustomers = await query(
      `SELECT c.name as customer, SUM(s.omzet) as total_omzet 
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       GROUP BY s.customer_id 
       ORDER BY total_omzet DESC 
       LIMIT 5`
    );

    // 3. Top Products
    const topProducts = await query(
      `SELECT p.name as produk, SUM(s.qty) as total_qty, SUM(s.omzet) as total_omzet 
       FROM sales s
       JOIN products p ON s.product_id = p.id
       GROUP BY s.product_id 
       ORDER BY total_omzet DESC 
       LIMIT 5`
    );

    // 4. Sales Performance
    const salesPerformance = await query(
      `SELECT sl.name as sales, SUM(s.omzet) as total_omzet, sl.target as total_target 
       FROM salespeople sl
       LEFT JOIN sales s ON s.sales_id = sl.id
       GROUP BY sl.id 
       ORDER BY total_omzet DESC`
    );

    // 5. Monthly Sales Trend (for chart)
    const salesTrend = await query(
      `SELECT s.tanggal, SUM(s.omzet) as total_omzet 
       FROM sales s
       GROUP BY s.tanggal 
       ORDER BY s.tanggal ASC`
    );

    // 6. Automated Insights Generation
    const insights = [];
    
    if (totalOmzet > 0) {
      // Achievement text
      if (totalTarget > 0) {
        if (totalOmzet >= totalTarget) {
          insights.push(`Selamat! Target penjualan keseluruhan telah tercapai sebesar **${achievementPercent.toFixed(1)}%** dari target Rp ${totalTarget.toLocaleString('id-ID')}.`);
        } else {
          insights.push(`Realisasi penjualan baru mencapai **${achievementPercent.toFixed(1)}%** dari target Rp ${totalTarget.toLocaleString('id-ID')}. Kurang Rp ${(totalTarget - totalOmzet).toLocaleString('id-ID')} untuk mencapai target.`);
        }
      }

      // Best product
      if (topProducts.length > 0) {
        const bestProduct = topProducts[0];
        const prodShare = (bestProduct.total_omzet / totalOmzet) * 100;
        insights.push(`Produk terlaris adalah **${bestProduct.produk}** dengan total omzet Rp ${bestProduct.total_omzet.toLocaleString('id-ID')} (berkontribusi **${prodShare.toFixed(1)}%** dari total omzet).`);
      }

      // Best sales performance
      const activeSales = salesPerformance.filter(s => s.total_target > 0);
      if (activeSales.length > 0) {
        const sortedByAch = [...activeSales].sort((a, b) => (b.total_omzet / b.total_target) - (a.total_omzet / a.total_target));
        const bestSales = sortedByAch[0];
        const bestSalesAch = (bestSales.total_omzet / bestSales.total_target) * 100;
        insights.push(`Sales dengan performa pencapaian target tertinggi adalah **${bestSales.sales}** dengan pencapaian **${bestSalesAch.toFixed(1)}%** dari target individunya.`);
      }

      // Best customer
      if (topCustomers.length > 0) {
        const bestCust = topCustomers[0];
        insights.push(`Kontributor omzet terbesar dari sisi customer diraih oleh **${bestCust.customer}** dengan total transaksi sebesar Rp ${bestCust.total_omzet.toLocaleString('id-ID')}.`);
      }
    } else {
      insights.push('Belum ada data penjualan. Silakan unggah file CSV data penjualan Anda untuk melihat statistik dan insight otomatis.');
    }

    return NextResponse.json({
      metrics: {
        totalOmzet,
        totalTarget,
        achievementPercent
      },
      topCustomers,
      topProducts,
      salesPerformance,
      salesTrend,
      insights
    });
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
