import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'tanggal';
    const order = searchParams.get('order') || 'DESC';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Validate sorting parameters to prevent SQL Injection
    const validSortColumns = ['tanggal', 'customer', 'produk', 'sales', 'qty', 'harga', 'omzet'];
    const safeSortBy = validSortColumns.includes(sortBy) ? sortBy : 'tanggal';
    const safeOrder = ['ASC', 'DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';

    // Construct search condition
    let whereClause = '';
    const params = [];
    if (search.trim()) {
      whereClause = `WHERE c.name LIKE ? OR p.name LIKE ? OR sl.name LIKE ?`;
      const searchWild = `%${search.trim()}%`;
      params.push(searchWild, searchWild, searchWild);
    }

    // Get total count for pagination
    const countSql = `
      SELECT COUNT(*) as count 
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN products p ON s.product_id = p.id
      JOIN salespeople sl ON s.sales_id = sl.id
      ${whereClause}
    `;
    const countResult = await query(countSql, params);
    const totalCount = countResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // Sort column mapping to use proper table aliases
    const sortColumnMapping = {
      tanggal: 's.tanggal',
      customer: 'c.name',
      produk: 'p.name',
      sales: 'sl.name',
      qty: 's.qty',
      harga: 's.harga',
      omzet: 's.omzet'
    };
    const sortCol = sortColumnMapping[safeSortBy] || 's.tanggal';

    const selectSql = `
      SELECT s.id, s.tanggal, c.name as customer, p.name as produk, sl.name as sales, s.qty, s.harga, s.omzet
      FROM sales s
      JOIN customers c ON s.customer_id = c.id
      JOIN products p ON s.product_id = p.id
      JOIN salespeople sl ON s.sales_id = sl.id
      ${whereClause}
      ORDER BY ${sortCol} ${safeOrder}
      LIMIT ? OFFSET ?
    `;
    
    const transactions = await query(selectSql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      transactions,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
