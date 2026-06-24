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

    // 3. Top Products (based on Omzet)
    const topProducts = await query(
      `SELECT p.name as produk, SUM(s.qty) as total_qty, SUM(s.omzet) as total_omzet 
       FROM sales s
       JOIN products p ON s.product_id = p.id
       GROUP BY s.product_id 
       ORDER BY total_omzet DESC 
       LIMIT 5`
    );

    // 4. Sales Performance (based on Omzet)
    const salesPerformance = await query(
      `SELECT sl.name as sales, SUM(s.omzet) as total_omzet, sl.target as total_target 
       FROM salespeople sl
       LEFT JOIN sales s ON s.sales_id = sl.id
       GROUP BY sl.id 
       ORDER BY total_omzet DESC`
    );

    // 5. Monthly/Daily Sales Trend (for chart)
    const salesTrend = await query(
      `SELECT s.tanggal, 
              SUM(s.omzet) as total_omzet,
              SUM(s.qty) as total_qty,
              COUNT(s.id) as total_transactions
       FROM sales s
       GROUP BY s.tanggal 
       ORDER BY s.tanggal ASC`
    );

    // 6. Query for quantity-based top lists (for advanced insights)
    const topSalesByQty = await query(
      `SELECT sl.name as sales, SUM(s.qty) as total_qty 
       FROM salespeople sl
       JOIN sales s ON s.sales_id = sl.id
       GROUP BY sl.id 
       ORDER BY total_qty DESC 
       LIMIT 1`
    );

    const topProductByQty = await query(
      `SELECT p.name as product, SUM(s.qty) as total_qty 
       FROM sales s
       JOIN products p ON s.product_id = p.id
       GROUP BY s.product_id 
       ORDER BY total_qty DESC 
       LIMIT 1`
    );

    // 7. Automated Insights Generation
    const insights = [];
    
    if (totalOmzet > 0) {
      // Achievement text
      if (totalTarget > 0) {
        if (totalOmzet >= totalTarget) {
          insights.push(`Selamat! Target penjualan keseluruhan telah tercapai sebesar <strong>${achievementPercent.toFixed(1)}%</strong> dari target Rp ${totalTarget.toLocaleString('id-ID')}.`);
        } else {
          insights.push(`Realisasi penjualan baru mencapai <strong>${achievementPercent.toFixed(1)}%</strong> dari target Rp ${totalTarget.toLocaleString('id-ID')}. Kurang Rp ${(totalTarget - totalOmzet).toLocaleString('id-ID')} untuk mencapai target.`);
        }
      }

      // Best product by Omzet
      if (topProducts.length > 0) {
        const bestProduct = topProducts[0];
        const prodShare = (bestProduct.total_omzet / totalOmzet) * 100;
        insights.push(`Produk dengan kontribusi omzet terbesar adalah <strong>${bestProduct.produk}</strong> dengan total omzet Rp ${bestProduct.total_omzet.toLocaleString('id-ID')} (<strong>${prodShare.toFixed(1)}%</strong> dari total omzet).`);
      }

      // Best product by Quantity
      if (topProductByQty.length > 0) {
        insights.push(`Produk paling laris secara volume (kuantitas) adalah <strong>${topProductByQty[0].product}</strong> dengan total <strong>${topProductByQty[0].total_qty}</strong> unit terjual.`);
      }

      // Best sales performance by Target Achievement
      const activeSales = salesPerformance.filter(s => s.total_target > 0);
      if (activeSales.length > 0) {
        const sortedByAch = [...activeSales].sort((a, b) => (b.total_omzet / b.total_target) - (a.total_omzet / a.total_target));
        const bestSales = sortedByAch[0];
        const bestSalesAch = (bestSales.total_omzet / bestSales.total_target) * 100;
        insights.push(`Sales dengan performa pencapaian target tertinggi diraih oleh <strong>${bestSales.sales}</strong> dengan pencapaian <strong>${bestSalesAch.toFixed(1)}%</strong> dari target individunya.`);
      }

      // Best sales performance by Volume
      if (topSalesByQty.length > 0) {
        insights.push(`Sales dengan volume penjualan barang terbanyak diraih oleh <strong>${topSalesByQty[0].sales}</strong> dengan total <strong>${topSalesByQty[0].total_qty}</strong> unit terjual.`);
      }

      // Best customer
      if (topCustomers.length > 0) {
        const bestCust = topCustomers[0];
        insights.push(`Kontributor omzet terbesar dari sisi customer diraih oleh <strong>${bestCust.customer}</strong> dengan total transaksi sebesar Rp ${bestCust.total_omzet.toLocaleString('id-ID')}.`);
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
