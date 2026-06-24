import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const salesId = searchParams.get('salesId') || '';
    const customerId = searchParams.get('customerId') || '';
    const productId = searchParams.get('productId') || '';

    // 1. Build WHERE filter clauses for the active period
    let whereClauses = [];
    const params = [];

    if (startDate) {
      whereClauses.push("s.tanggal >= ?");
      params.push(startDate);
    }
    if (endDate) {
      whereClauses.push("s.tanggal <= ?");
      params.push(endDate);
    }
    if (salesId) {
      whereClauses.push("s.sales_id = ?");
      params.push(salesId);
    }
    if (customerId) {
      whereClauses.push("s.customer_id = ?");
      params.push(customerId);
    }
    if (productId) {
      whereClauses.push("s.product_id = ?");
      params.push(productId);
    }

    const whereString = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    // 2. Fetch Active Period Basic Metrics
    const metricsSql = `
      SELECT 
        COALESCE(SUM(s.omzet), 0) as total_omzet,
        COALESCE(SUM(s.qty), 0) as total_qty,
        COUNT(s.id) as total_transactions,
        COUNT(DISTINCT s.customer_id) as active_customers,
        COUNT(DISTINCT s.product_id) as active_products
      FROM sales s
      ${whereString}
    `;
    const activeMetricsResult = await query(metricsSql, params);
    const totalOmzet = activeMetricsResult[0]?.total_omzet || 0;
    const totalQty = activeMetricsResult[0]?.total_qty || 0;
    const totalTransactions = activeMetricsResult[0]?.total_transactions || 0;
    const activeCustomers = activeMetricsResult[0]?.active_customers || 0;
    const activeProducts = activeMetricsResult[0]?.active_products || 0;

    // Fetch Target (if salesperson filter is applied, sum only their target, else sum all salespeople target)
    let targetSql = `SELECT COALESCE(SUM(target), 0) as total_target FROM salespeople`;
    const targetParams = [];
    if (salesId) {
      targetSql = `SELECT COALESCE(SUM(target), 0) as total_target FROM salespeople WHERE id = ?`;
      targetParams.push(salesId);
    }
    const targetResult = await query(targetSql, targetParams);
    const totalTarget = targetResult[0]?.total_target || 0;
    const achievementPercent = totalTarget > 0 ? (totalOmzet / totalTarget) * 100 : 0;

    // 3. Compute Previous Period and its Comparative Metrics (For Growth %)
    let prevOmzet = 0;
    let prevQty = 0;
    let prevTransactions = 0;
    let prevCustomers = 0;
    let hasPreviousPeriod = false;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

      // Compute previous period start and end dates
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - diffDays + 1);

      const prevStartDateStr = prevStart.toISOString().split('T')[0];
      const prevEndDateStr = prevEnd.toISOString().split('T')[0];

      // Build WHERE clauses for previous period
      let prevWhereClauses = ["s.tanggal >= ?", "s.tanggal <= ?"];
      const prevParams = [prevStartDateStr, prevEndDateStr];

      if (salesId) {
        prevWhereClauses.push("s.sales_id = ?");
        prevParams.push(salesId);
      }
      if (customerId) {
        prevWhereClauses.push("s.customer_id = ?");
        prevParams.push(customerId);
      }
      if (productId) {
        prevWhereClauses.push("s.product_id = ?");
        prevParams.push(productId);
      }

      const prevWhereString = "WHERE " + prevWhereClauses.join(" AND ");
      const prevMetricsSql = `
        SELECT 
          COALESCE(SUM(s.omzet), 0) as total_omzet,
          COALESCE(SUM(s.qty), 0) as total_qty,
          COUNT(s.id) as total_transactions,
          COUNT(DISTINCT s.customer_id) as active_customers
        FROM sales s
        ${prevWhereString}
      `;
      const prevMetricsResult = await query(prevMetricsSql, prevParams);
      prevOmzet = prevMetricsResult[0]?.total_omzet || 0;
      prevQty = prevMetricsResult[0]?.total_qty || 0;
      prevTransactions = prevMetricsResult[0]?.total_transactions || 0;
      prevCustomers = prevMetricsResult[0]?.active_customers || 0;
      hasPreviousPeriod = true;
    } else {
      // Fallback: If no date filter is chosen, compare the second half of all available data with the first half
      const datesSql = `SELECT MIN(tanggal) as min_date, MAX(tanggal) as max_date FROM sales`;
      const datesResult = await query(datesSql);
      const minDate = datesResult[0]?.min_date;
      const maxDate = datesResult[0]?.max_date;

      if (minDate && maxDate && minDate !== maxDate) {
        const start = new Date(minDate);
        const end = new Date(maxDate);
        const diffTime = Math.abs(end - start);
        const halfDiff = Math.ceil(diffTime / 2);
        
        const midPoint = new Date(start.getTime() + halfDiff);
        const midPointStr = midPoint.toISOString().split('T')[0];

        // Active period is second half (midPoint to maxDate)
        // Previous period is first half (minDate to day before midPoint)
        const prevEnd = new Date(midPoint);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const prevEndStr = prevEnd.toISOString().split('T')[0];

        let prevWhereClauses = ["s.tanggal >= ?", "s.tanggal <= ?"];
        const prevParams = [minDate, prevEndStr];

        if (salesId) {
          prevWhereClauses.push("s.sales_id = ?");
          prevParams.push(salesId);
        }
        if (customerId) {
          prevWhereClauses.push("s.customer_id = ?");
          prevParams.push(customerId);
        }
        if (productId) {
          prevWhereClauses.push("s.product_id = ?");
          prevParams.push(productId);
        }

        const prevWhereString = "WHERE " + prevWhereClauses.join(" AND ");
        const prevMetricsSql = `
          SELECT 
            COALESCE(SUM(s.omzet), 0) as total_omzet,
            COALESCE(SUM(s.qty), 0) as total_qty,
            COUNT(s.id) as total_transactions,
            COUNT(DISTINCT s.customer_id) as active_customers
          FROM sales s
          ${prevWhereString}
        `;
        const prevMetricsResult = await query(prevMetricsSql, prevParams);
        prevOmzet = prevMetricsResult[0]?.total_omzet || 0;
        prevQty = prevMetricsResult[0]?.total_qty || 0;
        prevTransactions = prevMetricsResult[0]?.total_transactions || 0;
        prevCustomers = prevMetricsResult[0]?.active_customers || 0;
        hasPreviousPeriod = true;
      }
    }

    // Compute Growth Percentages
    const computeGrowth = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / prev) * 100;
    };

    const growthMetrics = {
      hasPreviousPeriod,
      omzetGrowth: computeGrowth(totalOmzet, prevOmzet),
      qtyGrowth: computeGrowth(totalQty, prevQty),
      transactionsGrowth: computeGrowth(totalTransactions, prevTransactions),
      customersGrowth: computeGrowth(activeCustomers, prevCustomers),
      prevValues: {
        omzet: prevOmzet,
        qty: prevQty,
        transactions: prevTransactions,
        customers: prevCustomers
      }
    };

    // 4. Customers metrics (Filtered)
    const topCustomers = await query(
      `SELECT c.id as customer_id,
              c.name as customer, 
              COALESCE(SUM(s.omzet), 0) as total_omzet,
              COALESCE(SUM(s.qty), 0) as total_qty,
              COUNT(s.id) as total_transactions
       FROM sales s
       JOIN customers c ON s.customer_id = c.id
       ${whereString}
       GROUP BY s.customer_id 
       ORDER BY total_omzet DESC`,
      params
    );

    // 5. Products metrics (Filtered)
    const topProducts = await query(
      `SELECT p.id as product_id,
              p.name as produk, 
              COALESCE(SUM(s.omzet), 0) as total_omzet,
              COALESCE(SUM(s.qty), 0) as total_qty,
              COUNT(s.id) as total_transactions
       FROM sales s
       JOIN products p ON s.product_id = p.id
       ${whereString}
       GROUP BY s.product_id 
       ORDER BY total_omzet DESC`,
      params
    );

    // 6. Sales Performance metrics (Filtered)
    // Note: Left join salespeople to see target even if filtered, but we filter sales records
    // Let's build a custom query that filters transactions first, then aggregates.
    const salesPerformance = await query(
      `SELECT sl.id as sales_id,
              sl.name as sales, 
              COALESCE(SUM(s.omzet), 0) as total_omzet, 
              sl.target as total_target,
              COALESCE(SUM(s.qty), 0) as total_qty,
              COUNT(s.id) as total_transactions
       FROM salespeople sl
       LEFT JOIN sales s ON s.sales_id = sl.id ${whereClauses.length > 0 ? "AND " + whereClauses.join(" AND ") : ""}
       GROUP BY sl.id 
       ORDER BY total_omzet DESC`,
      [...params]
    );

    // 7. Monthly/Daily Sales Trend (Filtered)
    const salesTrend = await query(
      `SELECT s.tanggal, 
              COALESCE(SUM(s.omzet), 0) as total_omzet,
              COALESCE(SUM(s.qty), 0) as total_qty,
              COUNT(s.id) as total_transactions
       FROM sales s
       ${whereString}
       GROUP BY s.tanggal 
       ORDER BY s.tanggal ASC`,
      params
    );

    // 8. Advanced Quantity-based top queries (for AI insights)
    const topSalesByQty = await query(
      `SELECT sl.name as sales, COALESCE(SUM(s.qty), 0) as total_qty 
       FROM salespeople sl
       JOIN sales s ON s.sales_id = sl.id
       ${whereString}
       GROUP BY sl.id 
       ORDER BY total_qty DESC 
       LIMIT 1`,
      params
    );

    const topProductByQty = await query(
      `SELECT p.name as product, COALESCE(SUM(s.qty), 0) as total_qty 
       FROM sales s
       JOIN products p ON s.product_id = p.id
       ${whereString}
       GROUP BY s.product_id 
       ORDER BY total_qty DESC 
       LIMIT 1`,
      params
    );

    // 9. Automated Strategic AI Insights & Recommendations (Temuan -> Dampak -> Rekomendasi)
    const insights = [];
    
    if (totalOmzet > 0) {
      // Achievement text
      if (totalTarget > 0) {
        if (totalOmzet >= totalTarget) {
          insights.push({
            type: 'success',
            title: 'Target Penjualan Tercapai',
            text: `<strong>Temuan:</strong> Target penjualan keseluruhan telah terlampaui sebesar <strong>${achievementPercent.toFixed(1)}%</strong> dari target Rp ${totalTarget.toLocaleString('id-ID')}.<br/>
                   <strong>Dampak:</strong> Likuiditas bisnis sangat kuat dan kinerja operasional tim berada pada tingkat optimal.<br/>
                   <strong>Rekomendasi:</strong> Pertahankan momentum dengan memberikan insentif tim, dan lakukan kalibrasi target baru naik 10-15% untuk kuartal berikutnya.`
          });
        } else {
          const shortage = totalTarget - totalOmzet;
          insights.push({
            type: 'warning',
            title: 'Realisasi Target Penjualan',
            text: `<strong>Temuan:</strong> Realisasi target baru mencapai <strong>${achievementPercent.toFixed(1)}%</strong> dari target Rp ${totalTarget.toLocaleString('id-ID')}. Kurang Rp ${shortage.toLocaleString('id-ID')} untuk mencapai 100%.<br/>
                   <strong>Dampak:</strong> Potensi kegagalan pencapaian target tahunan yang berisiko pada evaluasi budget tahun depan.<br/>
                   <strong>Rekomendasi:</strong> Luncurkan program promosi akselerasi akhir periode untuk produk dengan margin tinggi dan optimalkan kunjungan prospek oleh tim sales.`
          });
        }
      }

      // Anomaly 1: Product concentration risk
      if (topProducts.length > 0) {
        const bestProduct = topProducts[0];
        const prodShare = (bestProduct.total_omzet / totalOmzet) * 100;
        
        if (prodShare >= 50) {
          insights.push({
            type: 'danger',
            title: 'Risiko Konsentrasi Produk Tinggi',
            text: `<strong>Temuan:</strong> Produk <strong>${bestProduct.produk}</strong> mendominasi penjualan sebesar <strong>${prodShare.toFixed(1)}%</strong> (Rp ${bestProduct.total_omzet.toLocaleString('id-ID')}).<br/>
                   <strong>Dampak:</strong> Risiko dependensi produk sangat tinggi. Jika terjadi hambatan rantai pasok atau penurunan minat pasar pada produk ini, omzet perusahaan akan anjlok drastis.<br/>
                   <strong>Rekomendasi:</strong> Segera lakukan diversifikasi portofolio penjualan, tawarkan bundel promo dengan item bernilai sedang lainnya, serta pantau ketat status stok pengaman (safety stock) produk ini.`
          });
        } else {
          insights.push({
            type: 'info',
            title: 'Kontribusi Produk Utama',
            text: `<strong>Temuan:</strong> Kontributor omzet terbesar disumbang oleh produk <strong>${bestProduct.produk}</strong> dengan pangsa <strong>${prodShare.toFixed(1)}%</strong>.<br/>
                   <strong>Dampak:</strong> Distribusi produk relatif sehat dan terdiversifikasi dengan baik.<br/>
                   <strong>Rekomendasi:</strong> Terus dorong ekspansi pasar untuk varian produk lainnya guna memperkuat struktur pendapatan.`
          });
        }
      }

      // Anomaly 2: Quota setting / Target realism check
      const activeSales = salesPerformance.filter(s => s.total_target > 0 && s.total_omzet > 0);
      if (activeSales.length > 0) {
        const sortedByAch = [...activeSales].sort((a, b) => (b.total_omzet / b.total_target) - (a.total_omzet / a.total_target));
        const bestSales = sortedByAch[0];
        const bestSalesAch = (bestSales.total_omzet / bestSales.total_target) * 100;

        // Check if average achievement is extremely high, indicating soft targets
        const totalAchSum = activeSales.reduce((acc, curr) => acc + (curr.total_omzet / curr.total_target) * 100, 0);
        const avgAch = totalAchSum / activeSales.length;

        if (avgAch >= 180) {
          insights.push({
            type: 'warning',
            title: 'Evaluasi Penentuan Batas Target (Quota Setting)',
            text: `<strong>Temuan:</strong> Rata-rata pencapaian sales melampaui target secara masif sebesar <strong>${avgAch.toFixed(1)}%</strong>, dengan <strong>${bestSales.sales}</strong> mencapai <strong>${bestSalesAch.toFixed(1)}%</strong>.<br/>
                   <strong>Dampak:</strong> Target kuota penjualan terindikasi kurang realistis (terlalu rendah / under-targeted). Hal ini membuat KPI tidak lagi efektif sebagai tolok ukur tantangan pemacu kinerja maksimal.<br/>
                   <strong>Rekomendasi:</strong> Lakukan evaluasi formula penentuan target (quota setting) pada periode berikutnya dengan menggunakan data histori penjualan riil, analisis kapasitas pasar, serta faktor pertumbuhan regional.`
          });
        } else {
          insights.push({
            type: 'success',
            title: 'Performa Sales Tertinggi',
            text: `<strong>Temuan:</strong> Salesperson dengan performa pencapaian target tertinggi diraih oleh <strong>${bestSales.sales}</strong> sebesar <strong>${bestSalesAch.toFixed(1)}%</strong>.<br/>
                   <strong>Dampak:</strong> Kontribusi personal yang luar biasa dalam mendorong pencapaian omzet korporat.<br/>
                   <strong>Rekomendasi:</strong> Berikan penghargaan publik (Sales of the Month) serta jadikan studi kasus metode penjualan terbaiknya sebagai acuan pelatihan bagi sales lain.`
          });
        }
      }

      // Anomaly 3: Customer concentration risk
      if (topCustomers.length > 0) {
        const bestCust = topCustomers[0];
        const custShare = (bestCust.total_omzet / totalOmzet) * 100;

        if (custShare >= 30) {
          insights.push({
            type: 'danger',
            title: 'Risiko Konsentrasi Pelanggan (Key Account Risk)',
            text: `<strong>Temuan:</strong> Pelanggan <strong>${bestCust.customer}</strong> menguasai <strong>${custShare.toFixed(1)}%</strong> total omzet dengan nilai Rp ${bestCust.total_omzet.toLocaleString('id-ID')}.<br/>
                   <strong>Dampak:</strong> Ketergantungan akun (Key Account Risk) sangat tinggi. Kehilangan pelanggan tunggal ini akan mengancam stabilitas arus kas bisnis.<br/>
                   <strong>Rekomendasi:</strong> Terapkan program loyalitas dan kunjungan rutin manajemen (executive sponsor program) untuk mengikat hubungan kerja sama, serta tingkatkan penetrasi pasar untuk mengakuisisi klien-klien korporat baru.`
          });
        } else {
          insights.push({
            type: 'info',
            title: 'Stabilitas Portofolio Pelanggan',
            text: `<strong>Temuan:</strong> Kontributor customer terbesar dipegang oleh <strong>${bestCust.customer}</strong> dengan kontribusi sehat sebesar <strong>${custShare.toFixed(1)}%</strong>.<br/>
                   <strong>Dampak:</strong> Portofolio bisnis aman dari ancaman hengkangnya satu pembeli dominan.<br/>
                   <strong>Rekomendasi:</strong> Pertahankan hubungan baik lewat program loyalty berkala dan perluas penawaran silang (cross-selling).`
          });
        }
      }
    } else {
      insights.push({
        type: 'info',
        title: 'Dashboard Siap Menerima Data',
        text: 'Belum ada data penjualan pada periode terpilih. Silakan unggah laporan penjualan bulanan (CSV/Excel) untuk meluncurkan analisis BI otomatis.'
      });
    }

    // 10. Fetch Last Upload Validation Log
    const validationResult = await query(
      `SELECT value FROM system_metadata WHERE key = ?`,
      ['last_upload_validation']
    );
    let lastUploadValidation = null;
    if (validationResult && validationResult[0]) {
      try {
        lastUploadValidation = JSON.parse(validationResult[0].value);
      } catch (e) {
        console.error('Error parsing validation metadata:', e);
      }
    }

    // 11. Fetch absolute date bounds of the entire dataset to anchor frontend filters
    const datesSql = `SELECT MIN(tanggal) as min_date, MAX(tanggal) as max_date FROM sales`;
    const datesResult = await query(datesSql);
    const minDate = datesResult[0]?.min_date || '';
    const maxDate = datesResult[0]?.max_date || '';

    return NextResponse.json({
      metrics: {
        totalOmzet,
        totalTarget,
        achievementPercent,
        totalQty,
        totalTransactions,
        activeCustomers,
        activeProducts
      },
      growthMetrics,
      topCustomers,
      topProducts,
      salesPerformance,
      salesTrend,
      insights,
      lastUploadValidation,
      dateRange: {
        minDate,
        maxDate
      }
    });
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
